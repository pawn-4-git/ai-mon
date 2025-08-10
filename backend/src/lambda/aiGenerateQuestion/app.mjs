import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/authHelper.js";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const bedrockClient = new BedrockRuntimeClient({ region: "ap-northeast-1" });

const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;
const MODEL_ID = "amazon.nova-lite-v1:0";

// Helper function to invoke Bedrock model
const invokeBedrock = async (prompt, systemPrompt) => {
    const inputBody = JSON.stringify({
        schemaVersion: "messages-v1",
        system: [{ text: systemPrompt }],
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { max_new_tokens: 1000, temperature: 0.7, top_p: 0.9 },
    });

    const command = new InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: Buffer.from(inputBody),
    });

    const bedrockResponse = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    return responseBody.output?.message?.content?.[0]?.text;
};


export const lambdaHandler = async (event) => {
    if (!QUESTIONS_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        const authResult = await validateSession(event);
        if (!authResult.isValid) {
            return authResult;
        }

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing." }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error("JSON parsing error:", e);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format in request body." }),
            };
        }

        const { sourceText, groupId } = body;

        if (!sourceText || !groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "SourceText and groupId are required." }),
            };
        }

        // 1. Generate Question, Answer, and Explanation from sourceText
        const questionGenerationPrompt = `以下の文章から、重要な情報に基づいた問題を生成してください。
        作成するのは問題文だけとします。
        問題は文章から特定できる内容に限定します。
        問題文内に選択肢は不要です。
        人名の場合は「・・・さん」と表記してください
        ヒントは不要です。
        問題は1問だけとして、

        文章:
        """
        ${sourceText}
        """`;

        const questionGenerationSystemPrompt = "あなたは、与えられた文章からクイズの問題を作成する専門家です。";
        const generatedQuestion = await invokeBedrock(questionGenerationPrompt, questionGenerationSystemPrompt);
        if (!generatedQuestion) {
            console.error("Bedrock did not return a valid question.");
            return { statusCode: 500, body: JSON.stringify({ message: "Failed to get a valid response from AI for question generation." }) };
        }

        // 1. Generate Question, Answer, and Explanation from sourceText
        const questionGenerationPromptCorrectChoice = `以下の文章から、重要な情報に基づいた解答を生成してください。
        解答は以下の元文章と問題文を参考に解答を作成してください。
        解答は選択肢の表記は不要です。
        解答は一つだけとします。出力は解答だけとします。

        元文章:
        """
        ${sourceText}
        """

        問題文:
        """
        ${generatedQuestion}
        """`;

        const correctChoice = await invokeBedrock(questionGenerationPromptCorrectChoice, questionGenerationSystemPrompt);
        if (!correctChoice) {
            console.error("Bedrock did not return a valid correct choice.");
            return { statusCode: 500, body: JSON.stringify({ message: "Failed to get a valid response from AI for correct choice generation." }) };
        }


        const questionGenerationPromptExplanation = `以下の文章から、重要な情報に基づいた解説を生成してください。
        次に元の文章と問題文と解答を記載するので、解答を説明する文章を解説とします。
        応答は解説だけとします。

        元文章:
        """
        ${sourceText}
        """

        問題文:
        """
        ${generatedQuestion}
        """
        解答:
        """
        ${correctChoice}
        """
        
        `;
        const explanation = await invokeBedrock(questionGenerationPromptExplanation, questionGenerationSystemPrompt);

        // 2. Generate Incorrect Choices
        const choiceGenerationPrompt = `以下の質問コンテキストに基づいて、不正解の選択肢を10個生成してください。正解は「${correctChoice}」です。
        結果は改行で分けて、不正解の選択肢以外は返さないでください。
        選択肢の先頭に数値や記号は不要です。
        選択肢の先頭に数値は不要です。
        不正解の選択肢が数値の場合は数値としてください。
        不正解の選択肢がアルファベットの場合はアルファベットとしてください。
        不正解の選択肢が数値とアルファベットの組み合わせの場合は、数値とアルファベットの組み合わせとしてください。
        不正解の選択肢が文章の場合は、似た文章を作成してください。
        不正解の選択肢の意味が必ず正解と一致しないようにしてください。
        正解の選択肢に人名がある場合は、人名を変更した選択肢を作ってください。
        正解の選択肢に地名がある場合は、地名を変更した選択肢を作ってください。
        不正解の先頭に数値をつける必要はありません。
        選択肢の先頭に数値や記号は不要です。
        `;

        const choiceGenerationSystemPrompt = "あなたはクイズを制作する製作者です。";
        const generatedChoicesText = await invokeBedrock(choiceGenerationPrompt, choiceGenerationSystemPrompt);

        if (!generatedChoicesText) {
            console.error("Bedrock did not return valid text for choices.");
            return { statusCode: 500, body: JSON.stringify({ message: "Failed to get a valid response from AI for choice generation." }) };
        }

        let incorrectChoices = generatedChoicesText.split('\n').map(line => line.trim()).filter(line => line !== '');

        // Remove choices that are the same as the correct answer and deduplicate
        incorrectChoices = [...new Set(incorrectChoices.filter(choice => choice !== correctChoice))];

        // 5. Generate the modified text with the answer part removed
        const textModificationPrompt = `以下の「元の文章」から、「答え」の根拠となる一文または部分を特定し、その部分だけを完全に削除した新しい文章を生成してください。
        生成する文章には、元の文章の他の部分はすべてそのまま含めてください。
        余計な解説や前置きは一切含めず、加工後の文章のみを返してください。

        元の文章:
        """
        ${sourceText}
        """

        削除するべき答え:
        """
        ${correctChoice}
        """
        `;
        const textModificationSystemPrompt = "あなたは、文章から特定の部分を削除して編集する専門家です。";
        const modifiedText = await invokeBedrock(textModificationPrompt, textModificationSystemPrompt);

        if (!modifiedText) {
            console.warn("Bedrock did not return a valid modified text. Returning original text.");
        }

        // 4. Return the generated question to the client
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Question generated successfully.",
                questionText: generatedQuestion,
                correctChoice: correctChoice,
                incorrectChoices: incorrectChoices,
                explanation: explanation,
                modifiedText: modifiedText || sourceText, // Return modified text, or original if modification fails
            }),
        };
    } catch (error) {
        console.error("Error generating question:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
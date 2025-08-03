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
    return responseBody.output.message.content[0].text;
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
        const questionGenerationPrompt = `以下の文章から、重要な情報に基づいた問題、その正解、そして解説を生成してください。

        文章:
        """
        ${sourceText}
        """

        生成する形式は以下のJSONフォーマットに従ってください。
        {
          "question": "生成された問題文",
          "answer": "問題の正解",
          "explanation": "問題の解説"
        }

        もし、与えられた文章から明確な問題と正解を生成できない場合は、"error" という文字列だ���を含むJSONを返してください。
        例:
        {
          "error": "問題を生成できませんでした。"
        }`;

        const questionGenerationSystemPrompt = "あなたは、与えられた文章からクイズの問題を作成する専門家です。";
        const generatedQuestionJSON = await invokeBedrock(questionGenerationPrompt, questionGenerationSystemPrompt);

        let generatedData;
        try {
            generatedData = JSON.parse(generatedQuestionJSON);
        } catch (e) {
            console.error("Failed to parse Bedrock response for question generation:", e);
            return { statusCode: 500, body: JSON.stringify({ message: "Failed to parse AI response." }) };
        }

        if (generatedData.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `問題の生成に失敗しました: ${generatedData.error}` }),
            };
        }

        const { question: questionText, answer: correctChoice, explanation } = generatedData;

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
        `;

        const choiceGenerationSystemPrompt = "あなたはクイズを制作する製作者です。";
        const generatedChoicesText = await invokeBedrock(choiceGenerationPrompt, choiceGenerationSystemPrompt);
        const incorrectChoices = generatedChoicesText.split('\n').map(line => line.trim()).filter(line => line !== '');

        // Ensure we have exactly 10 incorrect choices
        while (incorrectChoices.length < 10) {
            incorrectChoices.push(`ダミー選択肢 ${incorrectChoices.length + 1}`);
        }
        if (incorrectChoices.length > 10) {
            incorrectChoices.length = 10;
        }

        // 4. Return the generated question to the client
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Question generated successfully.",
                QuestionId: questionId,
                questionText: questionText,
                correctChoice: correctChoice,
                incorrectChoices: incorrectChoices,
                explanation: explanation,
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

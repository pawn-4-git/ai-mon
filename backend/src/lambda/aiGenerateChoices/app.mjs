import { validateSession } from "/opt/authHelper.js";
import { isAdmin } from "/opt/authHelper.js";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export const lambdaHandler = async (event) => {
    try {
        const authResult = await validateSession(event);
        if (!authResult.isValid) {
            return authResult;
        }

        // Check if the user is an administrator
        if (!await isAdmin(authResult.userId)) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "Only administrators can perform this action." }),
            };
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

        const { correctChoice, questionContext } = body;

        const bedrockClient = new BedrockRuntimeClient({
            region: "ap-northeast-1",
        });

        const prompt = `以下の質問コンテキストに基づいて、不正解の選択肢を20個生成してください。正解は「${correctChoice}」です。

質問コンテキスト:
${questionContext}

不正解の選択肢:
`;
        console.log(prompt);

        const params = {
            modelId: "amazon.nova-lite-v1:0", // 使用するモデルID
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
        };

        const command = new InvokeModelCommand(params);
        const bedrockResponse = await bedrockClient.send(command);

        // BedrockからのレスポンスをデコードしてJSONを抽出
        const responseBody = JSON.parse(Buffer.concat(bedrockResponse.body).toString());
        const generatedText = responseBody.content[0].text;

        // 生成されたテキストから不正解の選択肢を抽出（例：箇条書き形式を想定）
        const generatedChoices = generatedText.split('\n').filter(line => line.trim() !== '' && line.trim().startsWith('- ')).map(line => line.replace('- ', '').trim());

        // 生成された選択肢が10個未満の場合、ダミーの選択肢を追加
        while (generatedChoices.length < 10) {
            generatedChoices.push(`Placeholder Choice ${generatedChoices.length + 1}`);
        }

        // 生成された選択肢が3つより多い場合、最初の3つのみを使用
        const finalChoices = generatedChoices.slice(0, 10);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Choices generated successfully by Bedrock.",
                incorrectChoices: finalChoices,
            }),
        };
    } catch (error) {
        console.error("Error generating choices:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

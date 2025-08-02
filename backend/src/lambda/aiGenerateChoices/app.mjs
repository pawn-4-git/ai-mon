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
        結果は改行で分けて、不正解の選択肢以外は返さないでください。
        選択肢の先頭に数値は不要です。
        不正解の選択肢が数値の場合は数値としてください。
        不正解の選択肢がアルファベットの場合はアルファベットとしてください。
        不正解の選択肢が数値とアルファベットの組み合わせの場合は、数値とアルファベットの組み合わせとしてください。
        不正解の選択肢が文章の場合は、似た文章を作成してください。
        不正解の選択肢の意味が必ず正解と一致しないようにしてください。
        正解の選択肢に人名がある場合は、人名を変更した選択肢を作ってください。
        正解の選択肢に地名がある場合は、地名を変更した選択肢を作ってください。
        不正解の先頭に数値をつける必要はありません。

質問コンテキスト:
${questionContext}
`;

        // 呼び出すモデルIDを指定します。
        const modelId = "amazon.nova-lite-v1:0";

        // Novaモデルに渡すプロンプトとパラメータをJSON形式で定義します。
        // Novaモデルは「messages」スキーマを使用します。
        const inputBody = JSON.stringify({
            schemaVersion: "messages-v1",
            system: [
                {
                    text: "あなたはクイズを制作する製作者です。"
                }
            ],
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            inferenceConfig: {
                max_new_tokens: 500,
                temperature: 0.7,
                top_p: 0.9
            }
        });

        const input = {
            modelId,
            contentType: "application/json",
            accept: "application/json",
            body: Buffer.from(inputBody),
        };

        const command = new InvokeModelCommand(input);
        const bedrockResponse = await bedrockClient.send(command);

        // BedrockからのレスポンスをデコードしてJSONを抽出
        const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        const generatedText = responseBody.output.message.content[0].text;

        // 生成されたテキストから不正解の選択肢を抽出（例：箇条書き形式を想定）
        const generatedChoices = generatedText.split('\n').filter(line => line.trim() !== '');

        // 生成された選択肢が10個未満の場合、ダミーの選択肢を追加
        while (generatedChoices.length < 10) {
            generatedChoices.push(`Placeholder Choice ${generatedChoices.length + 1}`);
        }

        // 生成された選択肢が10個より多い場合、最初の10個のみを使用
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
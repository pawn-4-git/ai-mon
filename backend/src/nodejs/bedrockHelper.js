// backend/src/nodejs/bedrockHelper.js

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const modelConfigs = {
    "anthropic.claude-3-sonnet-20240229-v1:0": { region: "ap-northeast-1" },
    "anthropic.claude-3-haiku-20240307-v1:0": { region: "ap-northeast-1" },
    "openai.gpt-oss-20b-1:0": { region: "us-west-2" },
    "amazon.nova-lite-v1:0": { region: "ap-northeast-1" }
};

const getModelId = () => {
    const llmModel = process.env.LLM_MODEL;
    switch (llmModel) {
        case "claude-v3-sonnet":
            return "anthropic.claude-3-sonnet-20240229-v1:0";
        case "claude-v3-haiku":
            return "anthropic.claude-3-haiku-20240307-v1:0";
        case "gpt-oss-20b":
            return "openai.gpt-oss-20b-1:0";
        case "nova-lite":
        default:
            return "amazon.nova-lite-v1:0";
    }
};

// リージョンごとにBedrockクライアントをキャッシュする
const bedrockClients = {};

const getBedrockClient = (modelId) => {
    const region = modelConfigs[modelId]?.region || process.env.BEDROCK_REGION || "ap-northeast-1";
    if (!bedrockClients[region]) {
        bedrockClients[region] = new BedrockRuntimeClient({ region });
    }
    return bedrockClients[region];
};

export const invokeBedrock = async (prompt, systemPrompt) => {
    const modelId = getModelId();
    const bedrockClient = getBedrockClient(modelId);

    const inputBody = JSON.stringify({
        schemaVersion: "messages-v1",
        system: [{ text: systemPrompt }],
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { max_new_tokens: 1000, temperature: 0.7, top_p: 0.9 },
    });

    const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: "application/json",
        accept: "application/json",
        body: Buffer.from(inputBody),
    });

    try {
        const bedrockResponse = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        return responseBody.output?.message?.content?.[0]?.text;
    } catch (error) {
        console.error(`Error invoking Bedrock model ${modelId}:`, error);
        throw new Error("Failed to get a valid response from AI.");
    }
};
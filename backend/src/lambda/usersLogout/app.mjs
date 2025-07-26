import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!SESSIONS_TABLE_NAME) {
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

        const deleteCommand = new DeleteCommand({
            TableName: SESSIONS_TABLE_NAME,
            Key: {
                SessionId: authResult.sessionId,
            },
        });

        await docClient.send(deleteCommand);

        return {
            statusCode: 200,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
                // Set-Cookieを配列として指定する
                "Set-Cookie": [
                    `username=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
                    `sessionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
                    `sessionVersionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
                ]
            },
            body: JSON.stringify({
                message: "Logout successful.",
            }),
        };
    } catch (error) {
        console.error("Error processing logout request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

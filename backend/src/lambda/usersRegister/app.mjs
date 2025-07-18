import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!USERS_TABLE_NAME || !SESSIONS_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        const userId = body.accountName;

        if (!userId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "accountName is required." }),
            };
        }

        const now = new Date();
        const sessionId = randomUUID();
        
        // TTLを1ヶ月後に設定 (秒単位のUNIXタイムスタンプ)
        const ttl = new Date(now.setMonth(now.getMonth() + 1));
        const ttlTimestamp = Math.floor(ttl.getTime() / 1000);

        // ユーザー情報を登録
        const userItem = {
            userId: userId,
            CreatedAt: new Date().toISOString(),
            LastLoginAt: new Date().toISOString(),
            ExpiresAt: ttlTimestamp,
        };

        await docClient.send(new PutCommand({
            TableName: USERS_TABLE_NAME,
            Item: userItem,
        }));

        // セッション情報を登録
        const sessionItem = {
            sessionId: sessionId,
            userId: userId,
            ExpiresAt: ttlTimestamp,
        };

        await docClient.send(new PutCommand({
            TableName: SESSIONS_TABLE_NAME,
            Item: sessionItem,
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "User registered and session created successfully.",
                sessionId: sessionId,
            }),
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message }),
        };
    }
};
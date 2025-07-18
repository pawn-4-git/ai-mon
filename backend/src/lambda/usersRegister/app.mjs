import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const USER_TTL_MONTHS = 1;
const SESSION_TTL_DAYS = 1;

export const lambdaHandler = async (event) => {
    if (!USERS_TABLE_NAME || !SESSIONS_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
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

        const accountName = body.AccountName;

        if (!accountName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "accountName is required." }),
            };
        }

        const now = new Date();
        const userId = randomUUID();
        const sessionId = randomUUID();
        
        // User TTLを1ヶ月後に設定 (秒単位のUNIXタイムスタンプ)
        const userTtlDate = new Date(now);
        userTtlDate.setMonth(userTtlDate.getMonth() + USER_TTL_MONTHS);
        const userTtlTimestamp = Math.floor(userTtlDate.getTime() / 1000);

        // Session TTLを1日後に設定 (秒単位のUNIXタイムスタンプ)
        const sessionTtlDate = new Date(now);
        sessionTtlDate.setDate(sessionTtlDate.getDate() + SESSION_TTL_DAYS);
        const sessionTtlTimestamp = Math.floor(sessionTtlDate.getTime() / 1000);

        const userItem = {
            UserId: userId,
            AccountName: accountName,
            CreatedAt: now.toISOString(),
            LastLoginAt: now.toISOString(),
            ExpiresAt: userTtlTimestamp,
        };

        const sessionItem = {
            SessionId: sessionId,
            UserId: userId,
            ExpiresAt: sessionTtlTimestamp,
        };

        const transactCommand = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: USERS_TABLE_NAME,
                        Item: userItem,
                    },
                },
                {
                    Put: {
                        TableName: SESSIONS_TABLE_NAME,
                        Item: sessionItem,
                    },
                },
            ],
        });

        await docClient.send(transactCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "User registered and session created successfully.",
                UserId: userId,
                SessionId: sessionId,
            }),
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
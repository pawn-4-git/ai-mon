import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
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
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing." }),
            };
        }
        const body = JSON.parse(event.body);
        const accountName = body.accountName;

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
        userTtlDate.setMonth(userTtlDate.getMonth() + 1);
        const userTtlTimestamp = Math.floor(userTtlDate.getTime() / 1000);

        // Session TTLを1日後に設定 (秒単位のUNIXタイムスタンプ)
        const sessionTtlDate = new Date(now);
        sessionTtlDate.setDate(sessionTtlDate.getDate() + 1);
        const sessionTtlTimestamp = Math.floor(sessionTtlDate.getTime() / 1000);

        const userItem = {
            userId: userId,
            accountName: accountName,
            CreatedAt: now.toISOString(),
            LastLoginAt: now.toISOString(),
            ExpiresAt: userTtlTimestamp,
        };

        const sessionItem = {
            sessionId: sessionId,
            userId: userId,
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
                userId: userId,
                sessionId: sessionId,
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
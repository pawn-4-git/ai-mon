import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const USER_TTL_DAYS = 30;
const SESSION_TTL_DAYS = 1;

const calculateTtl = (baseDate, days) => {
    const ttlDate = new Date(baseDate);
    ttlDate.setDate(ttlDate.getDate() + days);
    return Math.floor(ttlDate.getTime() / 1000);
};

const generateRandomAccountName = (length) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
};

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

        let finalAccountName;
        const requestedAccountName = body.AccountName;

        if (requestedAccountName && requestedAccountName.trim()) {
            const trimmedAccountName = requestedAccountName.trim();
            if (trimmedAccountName.length < 3 || trimmedAccountName.length > 50) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "AccountName must be between 3 and 50 characters." }),
                };
            }
            finalAccountName = trimmedAccountName;
        } else {
            finalAccountName = generateRandomAccountName(15);
        }

        const now = new Date();
        const userId = randomUUID();
        const sessionId = randomUUID();
        const sessionVersionId = randomUUID();
        
        const userTtlTimestamp = calculateTtl(now, USER_TTL_DAYS);
        const sessionTtlTimestamp = calculateTtl(now, SESSION_TTL_DAYS);

        const userItem = {
            UserId: userId,
            AccountName: finalAccountName,
            CreatedAt: now.toISOString(),
            LastLoginAt: now.toISOString(),
            ExpiresAt: userTtlTimestamp,
        };

        const sessionItem = {
            SessionId: sessionId,
            UserId: userId,
            ExpiresAt: sessionTtlTimestamp,
            SessionVersionId: sessionVersionId,
        };

        // AccountNameの一意性を保証するためのアイテム
        const accountNameUniqueItem = {
            UserId: `UNAME#${finalAccountName}`,
            // このアイテムのTTLも設定しておくと、将来的にユーザー削除機能などを実装する際に役立ちます
            ExpiresAt: userTtlTimestamp, 
        };

        const transactCommand = new TransactWriteCommand({
            TransactItems: [
                {
                    // 1. AccountNameのユニーク制約をかける
                    Put: {
                        TableName: USERS_TABLE_NAME,
                        Item: accountNameUniqueItem,
                        ConditionExpression: "attribute_not_exists(UserId)",
                    },
                },
                {
                    // 2. ユーザー情報を登録する
                    Put: {
                        TableName: USERS_TABLE_NAME,
                        Item: userItem,
                    },
                },
                {
                    // 3. セッション情報を登録する
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
                SessionVersionId: sessionVersionId,
            }),
        };
    } catch (error) {
        // トランザクションが条件チェックの失敗によってキャンセルされたかを確認
        if (error.name === 'TransactionCanceledException' && error.CancellationReasons) {
            // The first transaction item is the one that checks for AccountName uniqueness.
            if (error.CancellationReasons[0]?.Code === 'ConditionalCheckFailed') {
                return {
                    statusCode: 409, // Conflict
                    body: JSON.stringify({ message: "AccountName is already taken." }),
                };
            }
        }
        
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

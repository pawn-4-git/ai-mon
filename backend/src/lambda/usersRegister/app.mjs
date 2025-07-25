import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID, randomInt } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const USER_TTL_DAYS = 30;
const SESSION_TTL_DAYS = 1;
const MIN_ACCOUNT_NAME_LENGTH = 10;
const MAX_ACCOUNT_NAME_LENGTH = 50;
const RANDOM_ACCOUNT_NAME_LENGTH = 15;
const ACCOUNT_NAME_UNIQUE_PREFIX = 'UNAME#';

const calculateTtl = (baseDate, days) => {
    const ttlDate = new Date(baseDate);
    ttlDate.setDate(ttlDate.getDate() + days);
    return Math.floor(ttlDate.getTime() / 1000);
};

const generateRandomAccountName = (length) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => charset.charAt(randomInt(0, charset.length))).join('');
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
        const requestedAccountName = body.AccountName?.trim();

        if (requestedAccountName) {
            if (requestedAccountName.length < MIN_ACCOUNT_NAME_LENGTH || requestedAccountName.length > MAX_ACCOUNT_NAME_LENGTH) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: `AccountName must be between ${MIN_ACCOUNT_NAME_LENGTH} and ${MAX_ACCOUNT_NAME_LENGTH} characters.` }),
                };
            }

            // --- 追加するバリデーション ---
            const hasAlphabet = /[a-zA-Z]/.test(requestedAccountName);
            const hasNumber = /[0-9]/.test(requestedAccountName);

            if (!hasAlphabet || !hasNumber) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "AccountName must contain at least one alphabet and one number." }),
                };
            }
            // --- 追加するバリデーションここまで ---

            finalAccountName = requestedAccountName;
        } else {
            finalAccountName = generateRandomAccountName(RANDOM_ACCOUNT_NAME_LENGTH);
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
            UserId: `${ACCOUNT_NAME_UNIQUE_PREFIX}${finalAccountName}`,
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
            "cookies": [
                `username=${finalAccountName}; HttpOnly; Secure; SameSite=Strict; path=/; max-age=86400`,
                `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; path=/; max-age=86400`,
                `sessionVersionId=${sessionVersionId}; HttpOnly; Secure; SameSite=Strict; path=/; max-age=86400`
            ],
            body: JSON.stringify({
                message: "User registered and session created successfully.",
                UserId: userId,
                SessionId: sessionId,
                SessionVersionId: sessionVersionId,
                AccountName: finalAccountName,
            }),
        };
    } catch (error) {
        // トランザクションが条件チェックの失敗によってキャンセルされたかを確認
        if (error.name === 'TransactionCanceledException' && error.CancellationReasons?.[0]?.Code === 'ConditionalCheckFailed') {
            // The first transaction item is the uniqueness check, so if it fails,
            // it means the AccountName is already taken.
            return {
                statusCode: 409, // Conflict
                body: JSON.stringify({ message: "AccountName is already taken." }),
            };
        }
        
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

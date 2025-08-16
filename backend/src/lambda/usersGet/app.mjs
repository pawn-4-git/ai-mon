import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession, isAdmin } from "/opt/authHelper.js";
import { updateAdminCheckTtl } from "/opt/userHelper.js";

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
        const authResult = await validateSession(event);
        if (!authResult.isValid) {
            return authResult;
        }
        const userId = authResult.userId;

        // --- Check if user is admin ---
        // 管理者権限を再確認する必要がある場合のみisAdminを実行
        let isAdminUser = authResult.admin;
        const now = Math.floor(Date.now() / 1000);
        if (!authResult.adminCheckExpireAt || authResult.adminCheckExpireAt <= now) {
            isAdminUser = await isAdmin(userId);
            await updateAdminCheckTtl(authResult.sessionId, isAdminUser);
        }

        // --- User Lookup ---
        const getUserCommand = new GetCommand({
            TableName: USERS_TABLE_NAME,
            Key: {
                "UserId": userId,
            },
        });

        const userResult = await docClient.send(getUserCommand);

        if (!userResult.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        const accountName = userResult.Item.AccountName;

        return {
            statusCode: 200,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
            },
            body: JSON.stringify({
                AccountName: accountName,
                UserId: userId,
                isAdmin: isAdminUser // 管理者判定結果を追加
            }),
        };
    } catch (error) {
        console.error("Error processing get user request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error during get user process." }),
        };
    }
};
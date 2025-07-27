// backend/src/nodejs/userHelper.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

/**
 * ユーザーの有効期限 (TTL) と最終ログイン時刻を更新する関数
 * 有効期限は現在時刻に1ヶ月後を設定します。
 * @param {string} userId - 更新対象のユーザーID
 * @returns {Promise<void>}
 */
export const updateUserTtl = async (userId) => {
    if (!USERS_TABLE_NAME) {
        throw new Error("USERS_TABLE_NAME environment variable is not set.");
    }

    const now = new Date();
    const lastLoginAt = now.toISOString();
    const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));
    const ttlTimestamp = Math.floor(oneMonthLater.getTime() / 1000);

    const command = new UpdateCommand({
        TableName: USERS_TABLE_NAME,
        Key: {
            UserId: userId,
        },
        UpdateExpression: "SET ExpiresAt = :expiresAt, LastLoginAt = :lastLoginAt",
        ExpressionAttributeValues: {
            ":expiresAt": ttlTimestamp,
            ":lastLoginAt": lastLoginAt,
        },
        ReturnValues: "UPDATED_NEW",
    });

    try {
        await docClient.send(command);
        console.log(`User TTL and LastLoginAt updated for userId: ${userId}`);
    } catch (error) {
        console.error(`Error updating user TTL and LastLoginAt for userId: ${userId}`, error);
        throw error;
    }
};

/**
 * セッションの有効期限 (TTL) とセッションバージョンIDを更新する関数
 * @param {string} sessionId - 更新対象のセッションID
 * @returns {Promise<string>} - 新しいセッションバージョンID
 */
export const updateSessionTtl = async (sessionId) => {
    if (!SESSIONS_TABLE_NAME) {
        throw new Error("SESSIONS_TABLE_NAME environment variable is not set.");
    }

    const newSessionVersionId = randomUUID();
    const newExpiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 1 day from now

    const command = new UpdateCommand({
        TableName: SESSIONS_TABLE_NAME,
        Key: {
            SessionId: sessionId,
        },
        UpdateExpression: "set SessionVersionId = :v, ExpiresAt = :e",
        ExpressionAttributeValues: {
            ":v": newSessionVersionId,
            ":e": newExpiresAt,
        },
    });

    try {
        await docClient.send(command);
        console.log(`Session TTL and Version updated for sessionId: ${sessionId}`);
        return newSessionVersionId;
    } catch (error) {
        console.error(`Error updating session for sessionId: ${sessionId}`, error);
        throw error;
    }
};

// backend/src/nodejs/userHelper.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME; // 環境変数からテーブル名を取得

/**
 * ユーザーの有効期限 (TTL) と最終ログイン時刻を更新する関数
 * 有効期限は現在時刻に1ヶ月後を設定します。
 * @param {string} userId - 更新対象のユーザーID
 * @returns {Promise<void>}
 */
export const updateUserTtl = async (userId) => { // ttlTimestamp パラメータを削除
    if (!USERS_TABLE_NAME) {
        throw new Error("USERS_TABLE_NAME environment variable is not set.");
    }

    // 現在時刻を取得
    const now = new Date();
    // 最終ログイン時刻をISO 8601形式で取得
    const lastLoginAt = now.toISOString();

    // 1ヶ月後のTTLを計算
    const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));
    const ttlTimestamp = Math.floor(oneMonthLater.getTime() / 1000); // 秒単位のUNIXタイムスタンプ

    const command = new UpdateCommand({
        TableName: USERS_TABLE_NAME,
        Key: {
            userId: userId, // プライマリキーに合わせて変更してください
        },
        UpdateExpression: "SET ExpiresAt = :expiresAt, LastLoginAt = :lastLoginAt", // ExpiresAtとLastLoginAtを更新
        ExpressionAttributeValues: {
            ":expiresAt": ttlTimestamp,
            ":lastLoginAt": lastLoginAt, // 最終ログイ���時刻を設定
        },
        ReturnValues: "UPDATED_NEW", // 更新後の属性を返す
    });

    try {
        const response = await docClient.send(command);
        console.log(`User TTL updated to ${ttlTimestamp} and LastLoginAt updated to ${lastLoginAt} for userId: ${userId}`, response);
    } catch (error) {
        console.error(`Error updating user TTL and LastLoginAt for userId: ${userId}`, error);
        throw error;
    }
};

// 他のユーザー関連ヘルパー関数があればここに追加
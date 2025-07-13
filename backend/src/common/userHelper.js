// backend/src/common/userHelper.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME; // 環境変数からテーブル名を取得

/**
 * ユーザーの有効期限 (TTL) を更新する関数
 * 有効期限は現在時刻に1ヶ月後を設定します。
 * @param {string} userId - 更新対象のユーザーID
 * @returns {Promise<void>}
 */
export const updateUserTtl = async (userId) => { // ttlTimestamp パラメータを削除
  if (!USERS_TABLE_NAME) {
    throw new Error("USERS_TABLE_NAME environment variable is not set.");
  }

  // 現在時刻を取得し、1ヶ月後を計算
  const now = new Date();
  const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));
  const ttlTimestamp = Math.floor(oneMonthLater.getTime() / 1000); // 秒単位のUNIXタイムスタンプ

  const command = new UpdateCommand({
    TableName: USERS_TABLE_NAME,
    Key: {
      userId: userId, // プライマリキーに合わせて変更してください
    },
    UpdateExpression: "SET ttl = :ttl",
    ExpressionAttributeValues: {
      ":ttl": ttlTimestamp,
    },
    ReturnValues: "UPDATED_NEW", // 更新後の属性を返す
  });

  try {
    const response = await docClient.send(command);
    console.log(`User TTL updated successfully for userId: ${userId} to ${ttlTimestamp}`, response);
  } catch (error) {
    console.error(`Error updating user TTL for userId: ${userId}`, error);
    throw error;
  }
};

// 他のユーザー関連ヘルパー関数があればここに追加
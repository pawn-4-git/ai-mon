/**
 * 
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 * 
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

// common/userHelper.js をインポート
import { updateUserTtl } from '/opt/common/userHelper.js';

export const lambdaHandler = async (event, context) => {
  // ユーザー登録処理など（ここでは仮の実装）
  const userId = event.body ? JSON.parse(event.body).accountName : 'defaultUser'; // 例としてaccountNameをuserIdとする

  try {
    // ユーザーのTTLを更新
    await updateUserTtl(userId);
    console.log(`TTL updated for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to update TTL for user: ${userId}`, error);
    // エラーハンドリング
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update user TTL', error: error.message }),
    };
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'usersRegister', // 先ほど置換したメッセージ
    }),
  };

  return response;
};
// /Users/pawndeveloper/workspace/aimon/backend/src/lambda/userRegister/tests/unit/test-handler.mjs

import { lambdaHandler } from '../../app.mjs'; // app.mjsからのインポートパスを確認してください

describe('Lambda Handler', () => {
  it('should return a successful response with usersRegister message', async () => {
    // API Gatewayからのイベントを模したeventオブジェクトを作成
    const event = {
      body: JSON.stringify({ accountName: 'test-user' }),
      // 他に必要なプロパティがあれば追加 (例: httpMethod, path, headers など)
    };
    const context = {}; // contextは通常、テストでは空オブジェクトで十分です

    // lambdaHandlerを実行
    const result = await lambdaHandler(event, context);

    // 結果をアサート
    expect(result.statusCode).to.equal(200);
    expect(result.body).to.equal(JSON.stringify({ message: 'usersRegister' }));
  });

  // event.bodyが不正な場合のテストケースも追加すると良いでしょう
  it('should return an error response for invalid request body', async () => {
    const event = {
      body: 'invalid json', // 不正なbody
    };
    const context = {};

    const result = await lambdaHandler(event, context);

    expect(result.statusCode).to.equal(400); // エラーコードは400を期待
    expect(result.body).to.include('Invalid request body');
  });

  // event.bodyがnullの場合のテストケース
  it('should handle null event body gracefully', async () => {
    const event = {
      body: null,
    };
    const context = {};

    const result = await lambdaHandler(event, context);

    // null bodyの場合、userIdはデフォルト値 'defaultUser' になるはずです
    // その後の処理が成功すれば、ステータスコード200が返るはずです
    expect(result.statusCode).to.equal(200);
    expect(result.body).to.equal(JSON.stringify({ message: 'usersRegister' }));
  });
});
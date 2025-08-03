# バックエンド機能一覧 (REST API)

**API認証について:**

*   新規ユーザー登録API (`POST /users/register`) を除く全てのAPIエンドポイントは、認証が必要です。
*   認証には、ログイン時に発行されるセッショントークン（またはJWTなど）をリクエストヘッダーに含める必要があります。
*   認証されていないリクエストは、通常 `401 Unauthorized` エラーを返します。

---

## 1. ユーザー管理 (User Management)

*   **`POST /users/register`**: 新規ユーザー登録
    *   リクエストボディ: `{ "accountName": "ユーザー名" }` (パスワードは不要)
    *   レスポンス: 登録成功/失敗、ユーザー情報
*   **`POST /users/login`**: ユーザーログイン
    *   リクエストボディ: `{ "accountName": "ユーザー名" }`
    *   レスポンス: ログイン成功/失敗、セッショントークンなど
*   **`POST /users/logout`**: ユーザーログアウト
    *   レスポンス: ログアウト成功/失敗
*   **`DELETE /users/:userId`**: ユーザーアカウント削除 (特権ユーザーのみ)
    *   パスパラメータ: `userId`
    *   レスポンス: 削除成功/失敗

## 2. 問題グループ管理 (Quiz Group Management)

*   **`POST /quiz-groups`**: 新しい問題グループ作成 (特権ユーザーのみ)
    *   リクエストボディ: `{ "name": "グループ名", "questionCount": 10, "timeLimitMinutes": 15 }`
    *   レスポンス: 作成されたグループ情報
*   **`GET /quiz-groups`**: 問題グループ一覧取得
    *   クエリパラメータ: `userId` (ユーザーIDを指定して、そのユーザーに関連するグループを取得)
    *   レスポンス: 問題グループのリスト (未受験、更新あり、受験済みなどのステータス情報を含む)
*   **`GET /quiz-groups/:groupId`**: 特定の問題グループ詳細取得
    *   パスパラメータ: `groupId`
    *   レスポンス: グループ詳細情報
*   **`PUT /quiz-groups/:groupId`**: 問題グループ情報更新 (特権ユーザーのみ)
    *   パスパラメータ: `groupId`
    *   リクエストボディ: 更新内容
    *   レスポンス: 更新成功/失敗
*   **`DELETE /quiz-groups/:groupId`**: 問題グループ削除 (特権ユーザーのみ)
    *   パスパラメータ: `groupId`
    *   レスポンス: 削除成功/失敗

## 3. 問題管理 (Question Management)

*   **`POST /quiz-groups/:groupId/questions`**: 問題作成 (手動または自動生成) (特権ユーザーのみ)
    *   パスパラメータ: `groupId`
    *   リクエストボディ:
        *   手動作成: `{ "type": "manual", "questionText": "問題文", "correctChoice": "正解", "incorrectChoices": ["誤答1", "誤答2", "誤答3"], "explanation": "解説文" }`
        *   自動生成: `{ "type": "auto", "sourceText": "文章", "title": "問題タイトル" }` (AI連携部分)
    *   レスポンス: 作成された問題情報
*   **`GET /quiz-groups/:groupId/questions`**: 特定グループの問題一覧取得
    *   パスパラメータ: `groupId`
    *   レスポンス: 問題リスト
*   **`GET /questions/:questionId`**: 特定の問題詳細取得
    *   パスパラメータ: `questionId`
    *   レスポンス: 問題詳細
*   **`PUT /questions/:questionId`**: 問題情報更新 (特権ユーザーのみ)
    *   パスパラメータ: `questionId`
    *   リクエストボディ: 更新内容
    *   レスポンス: 更新成功/失敗
*   **`DELETE /questions/:questionId`**: 問題削除 (特権ユーザーのみ)
    *   パスパラメータ: `questionId`
    *   レスポンス: 削除成功/失敗

## 4. 解答・成績管理 (Answer & Score Management)

*   **`POST /quizzes/:quizId/answers`**: クイズ解答送信
    *   パスパラメータ: `quizId` (グループIDまたはテストセッションIDなど)
    *   リクエストボディ: `{ "userId": "ユーザーID", "answers": [{ "questionId": "問題ID", "selectedChoice": "選択肢" }], "status": "completed" | "in-progress" }`
    *   レスポンス: 解答結果、正解率など
*   **`GET /results/{quizSessionId}`**: クイズ結果取得
    *   パスパラメータ: `quizSessionId`
    *   クエリパラメータ (任意): `questionNumber` (問題番号)
    *   レスポンス: 
        *   `questionNumber`指定なし: 各問題の解答状況、正解、解説などを含むクイズセッション全体の詳細。
        *   `questionNumber`指定あり: 指定された問題に関する情報（問題文、選択肢、ユーザーの解答）。
*   **`GET /score`**: ユーザーの成績履歴取得
    *   パスパラメータ: `userId`
    *   レスポンス: 成績記録のリスト
*   **`POST /users/:userId/scores`**: 成績記録保存
    *   パスパラメータ: `userId`
    *   リクエストボディ: `{ "quizId": "クイズID", "score": 85, "date": "YYYY-MM-DD" }`
    *   レスポンス: 保存成功/失敗
*   **`DELETE /scores/:scoreId`**: 成績記録削除
    *   パスパラメータ: `scoreId`
    *   レスポンス: 削除成功/失敗
*   **`GET /users/:userId/performance-analysis`**: ユーザーの成績分析 (グループ別分析、苦手傾向分析など)
    *   パスパラメータ: `userId`
    *   レスポンス: 分析結果

## 5. 参考書・関連リソース管理 (Reference Resource Management)

*   **`POST /quiz-groups/:groupId/resources`**: 参考書リンク追加 (特権ユーザーのみ)
    *   パスパラメータ: `groupId`
    *   リクエストボディ: `{ "url": "URL", "title": "タイトル", "imgSrc": "画像URL" }`
    *   レスポンス: 追加されたリソース情報
*   **`GET /quiz-groups/:groupId/resources`**: 参考書リンク一覧取得
    *   パスパラメータ: `groupId`
    *   レスポンス: リソースリスト
*   **`DELETE /resources/:resourceId`**: 参考書リンク削除 (特権ユーザーのみ)
    *   パスパラメータ: `resourceId`
    *   レスポンス: 削除成功/失敗

## 6. AI連携 (AI Integration) (特権ユーザーのみ)

*   **`POST /ai/generate-question`**: 文章からの問題自動生成
    *   リクエストボディ: `{ "sourceText": "文章", "groupId": "グループID" }`
    *   レスポンス: 生成された問題文、正解選択肢、誤答選択肢、解説
*   **`POST /ai/generate-choices`**: 問題に対する誤答選択肢生成
    *   リクエストボディ: `{ "correctChoice": "正解", "questionContext": "問題文のコンテキスト" }`
    *   レスポンス: 生成された誤答選択肢

## 7. データ管理 (Data Management)

*   **`DELETE /users/inactive`**: 非アクティブユーザーのデータ削除 (特権ユーザーのみ、またはバッチ処理)
    *   （これはAPIエンドポイントというよりは、定期実行されるバッチ処理やスクリプトとして実装される可能性が高いです）

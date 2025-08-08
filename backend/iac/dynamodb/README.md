# DynamoDB データモデル (マルチテーブルデザイン)

このドキュメントでは、「あいもん」アプリケーションのバックエンドで使用される Amazon DynamoDB のデータモデルについて説明します。
開発の分かりやすさとメンテナンス性を重視し、各データエンティティを個別のテーブルで管理するマルチテーブルデザインを採用します。

---

## テーブル一覧

1.  **UsersTable**: ユーザー情報を管理
2.  **QuizGroupsTable**: 問題グループを管理
3.  **QuestionsTable**: 個別の問題を管理
4.  **ScoresTable**: ユーザーの成績記録を管理
5.  **ResourcesTable**: 参考書やリソースのリンクを管理
6.  **SessionsTable**: ユーザーのセッション情報を管理

---

## 各テーブルの詳細

### 1. UsersTable

ユーザーアカウント情報を格納します。

- **テーブル名:** `UsersTable`
- **Partition Key (PK):** `UserId` (String)

**属性:**
- `UserId`: 一意のユーザーID (UUIDなど)
- `AccountName`: ユーザーが登録したアカウント名 (GSIのPKになります)
- `Role`: ユーザーの権限 (`admin` または `user`)
- `CreatedAt`: アカウント作成日時 (ISO 8601形式)
- `LastLoginAt`: 最終ログイン日時 (ISO 8601形式)
- `ExpiresAt`: アカウントの有効期限 (Unixタイムスタンプ)。TTL属性として利用。

**グローバルセカンダリインデックス (GSI):**
- **IndexName:** `AccountNameIndex`
- **GSI PK:** `AccountName`
- **目的:** ログイン処理時にアカウント名でユーザーを効率的に検索するため。

### 2. QuizGroupsTable

問題集のグループ情報を格納します。

- **テーブル名:** `QuizGroupsTable`
- **Partition Key (PK):** `GroupId` (String)

**属性:**
- `GroupId`: 一意のグループID (UUIDなど)
- `Name`: グループ名 (例: 「数学」「歴史」)
- `QuestionCount`: グループに含まれる問題数
- `TimeLimitMinutes`: 制限時間 (分)
- `CreatedAt`: 作成日時
- `UpdatedAt`: 最終更新日時
- `CreatedBy`: 作成者の `UserId`

### 3. QuestionsTable

各問題の詳細情報を格納します。

- **テーブル名:** `QuestionsTable`
- **Partition Key (PK):** `QuestionId` (String)

**属性:**
- `QuestionId`: 一意の問題ID (UUIDなど)
- `GroupId`: 所属する問題グループのID (GSIのPKになります)
- `QuestionText`: 問題文
- `Choices`: 選択肢 (Map形式)
    - `Correct`: 正解の選択肢 (String)
    - `Incorrect`: 不正解の選択肢 (List of Strings)
- `Explanation`: 解説文
- `CreatedAt`: 作成日時
- `UpdatedAt`: 最終更新日時

**グローバルセカンダリインデックス (GSI):**
- **IndexName:** `GroupIdIndex`
- **GSI PK:** `GroupId`
- **目的:** 特定のグループに属する全ての問題を効率的に取得するため。

### 4. ScoresTable

ユーザーがクイズを完了した際の成績を記録します。

- **テーブル名:** `ScoresTable`
- **Partition Key (PK):** `QuizSessionId` (String)

**属性:**
- `QuizSessionId`: 解答セッションごとの一意のID (UUIDなど)
- `UserId`: 解答したユーザーのID (GSIのPKになります)
- `GroupId`: 解答した問題グループのID
- `Score`: 正解率 (例: 85.5)
- `CorrectCount`: 正解数
- `TotalCount`: 全問題数
- `Answers`: ユーザーの解答リスト (Array of Objects)
  - `QuestionId`: 解答した問題のID
  - `QuestionText`: 問題文
  - `Choices`: 表示された選択肢の配列 (Array of Strings)
  - `CorrectChoice`: 正解の選択肢 (String)
  - `SelectedChoice`: ユーザーが選択した解答 (String, nullable)
  - `IsCorrect`: 正解かどうか (Boolean, nullable)
  - `ReferenceURL`: 解説や参考情報のURL (String)
  - `AtferCheck`: 後から確認するチェック
- `SubmittedAt`: 解答提出日時
- `StartedAt`: 試験開始日時 (ISO 8601形式)
- `ExpiresAt`: 試験の期限日時 (ISO 8601形式)

**グローバルセカンダリインデックス (GSI):**
- **IndexName:** `UserIdStartedAtIndex`
- **GSI PK:** `UserId`
- **目的:** 特定のユーザーの全成績記録を効率的に取得するため。

### 5. ResourcesTable

問題グループに関連する参考書や学習リソースのリンクを格納します。

- **テーブル名:** `ResourcesTable`
- **Partition Key (PK):** `ResourceId` (String)

**属性:**
- `ResourceId`: 一意のリソースID (UUIDなど)
- `GroupId`: 関連する問題グループのID (GSIのPKになります)
- `URL`: リソースのURL
- `Title`: タイトル
- `ImgSrc`: 画像URL
- `CreatedAt`: 作成日時

**グローバルセカンダリインデックス (GSI):**
- **IndexName:** `GroupIdIndex`
- **GSI PK:** `GroupId`
- **目的:** 特定のグループに関連する全てのリソースを効率的に取得するため。

### 6. SessionsTable

ユーザーのログインセッション情報を管理します。

- **テーブル名:** `SessionsTable`
- **Partition Key (PK):** `SessionId` (String)
- **TTL属性:** `ExpiresAt`

**属性:**
- `SessionId`: ランダムに生成された一意のセッションID
- `UserId`: 関連するユーザーのID
- `ExpiresAt`: セッションの有効期限 (Unixタイムスタンプ)。この時刻を過ぎるとアイテムは自動的に削除されます。
- `CreatedAt`: セッション作成日時

**目的:**
ユーザーのログイン状態を管理し、セッションの有効期限が切れたデータを自動的にクリーンアップするために使用します。
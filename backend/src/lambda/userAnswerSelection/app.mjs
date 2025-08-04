import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!SCORES_TABLE_NAME) {
        console.error("環境変数にテーブル名が設定されていません。");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "サーバー内部エラー: テーブル設定がありません。" }),
        };
    }

    try {
        const authResult = await validateSession(event);
        if (!authResult.isValid) {
            return authResult;
        }

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "リクエストボディがありません。" }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error("JSONの解析エラー:", e);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "リクエストボディのJSON形式が正しくありません。" }),
            };
        }

        const { scoreId, questionNumber, checkedLaterQuestions, afterCheckValue } = body;

        if (!scoreId || !questionNumber || !Array.isArray(checkedLaterQuestions)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "scoreId, questionNumber, checkedLaterQuestionsは必須です。" }),
            };
        }

        const questionIndex = questionNumber - 1;
        if (questionIndex < 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "無効なquestionNumberです。" }),
            };
        }

        // afterCheckValueが渡されていればその値を使い、なければtrueをデフォルト値とする
        const setAfterCheck = (afterCheckValue === undefined) ? true : afterCheckValue;

        const updateCommand = new UpdateCommand({
            TableName: SCORES_TABLE_NAME,
            Key: { QuizSessionId: scoreId },
            UpdateExpression: `SET Answers[${questionIndex}].AfterCheck = :afterCheck, checkedLaterQuestions = :checkedLaterQuestions`,
            ExpressionAttributeValues: {
                ":afterCheck": setAfterCheck,
                ":checkedLaterQuestions": checkedLaterQuestions,
            },
            ReturnValues: "ALL_NEW",
        });

        const { Attributes } = await docClient.send(updateCommand);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(Attributes),
        };

    } catch (error) {
        console.error("回答の保存中にエラーが発生しました:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "回答の保存に失敗しました。" }),
        };
    }
};

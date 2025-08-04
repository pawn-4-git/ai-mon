import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;

/**
 * リクエストボディに基づいて、DynamoDBのUpdateオペレーション用のパラメータを構築する。
 * @param {object} body - リクエストボディ。
 * @returns {object} - UpdateCommand用のパラメータ。
 */
const buildUpdateParams = async (body) => {
    const { answers, checkedLaterQuestions, questionNumber, userAnswer } = body;

    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};


    const targetQuestionIndex = questionNumber - 1;
    if (targetQuestionIndex >= 0 && userAnswer !== undefined) {
        // answers配列の特定要素のselectedChoiceを更新
        updateExpressions.push(`#ans[${targetQuestionIndex}].SelectedChoice = :selectedChoice`);
        expressionAttributeNames[`#ans`] = "Answers";
        expressionAttributeValues[`:selectedChoice`] = userAnswer;
    } else if (questionNumber !== undefined && targetQuestionIndex < 0) {
        console.warn(`Question number ${questionNumber} is out of bounds.`);
        // 必要に応じてエラーハンドリングを追加
    }



    if (checkedLaterQuestions) {
        updateExpressions.push("checkedLaterQuestions = :checkedLaterQuestions");
        expressionAttributeValues[":checkedLaterQuestions"] = checkedLaterQuestions;
    }

    return {
        UpdateExpression: "SET " + updateExpressions.join(", "),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    };
};

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

        // URLパスからscoreIdを取得
        // template.yamlのPath: /quizzes/{quizId}/answers に基づいて、quizIdを取得
        const quizId = event.pathParameters?.quizId;

        if (!quizId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "URLパスからscoreIdを取得できませんでした。" }),
            };
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

        // リクエストボディからscoreIdを削除（パスから取得したものを優先するため）
        // ただし、buildUpdateParams内でbodyを使用しているため、削除せずに上書きする形でも良い
        // ここでは、パスから取得したscoreIdを直接UpdateCommandで使用する

        if (!body.questionNumber && !body.userAnswer) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "更新するデータがありません。" }),
            };
        }

        const updateParams = await buildUpdateParams(body);
        const updateCommand = new UpdateCommand({
            TableName: SCORES_TABLE_NAME,
            Key: { QuizSessionId: quizId }, // パスから取得したIDを使用
            ...updateParams,
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
        console.error("スコアの更新中にエラーが発生しました:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "スコアの更新に失敗しました。" }),
        };
    }
};
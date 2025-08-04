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


    // DynamoDBのUpdateExpressionで配列の特定要素を更新するには、
    // パスと値の指定が必要。例: #ans[0].selectedChoice = :selectedChoice
    // ここでは、answers配列全体を更新するのではなく、
    // 特定の問題に対する回答のみを更新するロジックを実装する。
    // もしanswersが常に配列で、その中にquestionNumberとselectedChoiceが含まれる場合、
    // 以下のようなパスを使用する。
    // ただし、DynamoDBのUpdateExpressionでは配列のインデックスを指定して更新するのが一般的。
    // questionNumberが0から始まるインデックスとして扱われると仮定する。
    // もしquestionNumberが1から始まる場合は、answerIndex = questionNumber - 1 とする。
    // ここでは、questionNumberが1から始まることを想定し、answerIndexを調整する。
    // questionNumberが1から始まることを想定し、targetQuestionIndexを調整する。
    const targetQuestionIndex = questionNumber - 1;
    if (targetQuestionIndex >= 0 && userAnswer !== undefined) {
        // answers配列の特定要素のselectedChoiceを更新
        updateExpressions.push(`#ans[${targetQuestionIndex}].selectedChoice = :selectedChoice`);
        expressionAttributeNames[`#ans`] = "answers";
        expressionAttributeValues[`:selectedChoice`] = userAnswer;
    } else if (targetQuestionIndex < 0 || targetQuestionIndex >= answers.length) {
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

        if (!body.answers && !body.checkedLaterQuestions) {
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
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;
const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

/**
 * リクエストボディに基づいて、DynamoDBのUpdateオペレーション用のパラメータを構築する。
 * BatchGetItemを使用して質問情報をまとめて取得する。
 * @param {object} body - リクエストボディ。
 * @returns {object} - UpdateCommand用のパラメータ。
 */
const buildUpdateParamsForCompletion = async (body) => {
    const { scoreId, answers } = body;

    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    let correctCount = 0;
    if (answers && answers.length > 0) {
        // BatchGetItemのために、取得するキーのリストを作成
        const keys = answers.map(answer => ({ QuestionId: answer.questionId }));

        const batchGetCommand = new BatchGetCommand({
            RequestItems: {
                [QUESTIONS_TABLE_NAME]: {
                    Keys: keys,
                },
            },
        });

        const questionResponses = await docClient.send(batchGetCommand);
        const questions = questionResponses.Responses[QUESTIONS_TABLE_NAME];

        // 回答と質問を照合して正解数をカウント
        if (questions) {
            const questionMap = new Map(questions.map(q => [q.QuestionId, q]));
            for (const answer of answers) {
                const question = questionMap.get(answer.questionId);
                if (question && question.CorrectChoice === answer.selectedChoice) {
                    correctCount++;
                }
            }
        }

        const score = Math.round((correctCount / answers.length) * 100);
        updateExpressions.push("#ans = :answers");
        expressionAttributeNames["#ans"] = "answers";
        expressionAttributeValues[":answers"] = answers;
        updateExpressions.push("score = :score");
        expressionAttributeValues[":score"] = score;
        updateExpressions.push("isFinished = :isFinished");
        expressionAttributeValues[":isFinished"] = true;
        updateExpressions.push("finishedAt = :finishedAt");
        expressionAttributeValues[":finishedAt"] = new Date().toISOString();
    } else {
        // answers がない場合でも isFinished を true に設定する
        updateExpressions.push("isFinished = :isFinished");
        expressionAttributeValues[":isFinished"] = true;
        updateExpressions.push("finishedAt = :finishedAt");
        expressionAttributeValues[":finishedAt"] = new Date().toISOString();
    }

    return {
        UpdateExpression: "SET " + updateExpressions.join(", "),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    };
};

export const lambdaHandler = async (event) => {
    if (!SCORES_TABLE_NAME || !QUESTIONS_TABLE_NAME) {
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

        const { scoreId, answers } = body;

        if (!scoreId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "scoreIdは必須です。" }),
            };
        }

        const updateParams = await buildUpdateParamsForCompletion(body);

        const updateCommand = new UpdateCommand({
            TableName: SCORES_TABLE_NAME,
            Key: { ScoreId: scoreId },
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
        console.error("クイズ完了処理中にエラーが発生しました:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "クイズ完了処理に失敗しました。" }),
        };
    }
};
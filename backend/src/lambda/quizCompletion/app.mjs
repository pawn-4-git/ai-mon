import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;
const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

/**
 * リクエストボディに基づいて、DynamoDBのUpdateオペレーション用のパラメータを構築する。
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
        for (const answer of answers) {
            const getQuestionCommand = new GetCommand({
                TableName: QUESTIONS_TABLE_NAME,
                Key: { QuestionId: answer.questionId },
            });
            const questionResponse = await docClient.send(getQuestionCommand);
            if (questionResponse.Item && questionResponse.Item.CorrectChoice === answer.selectedChoice) {
                correctCount++;
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
        // answers がない場合でも isFinished を true に設定す���
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

        // isFinished はこの Lambda で true に設定されるため、リクエストボディには含めない
        // answers が空の場合でも、完了としてマークするために処理を続行する

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

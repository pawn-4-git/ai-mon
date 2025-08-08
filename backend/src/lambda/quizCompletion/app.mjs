import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

        const newSession = await updateSessionTtl(authResult.sessionId);

        if (!event.body) {
            return {
                statusCode: 400,
                multiValueHeaders: {
                    "Content-Type": ["application/json"], // Content-Typeも配列にする
                    // Set-Cookieを配列として指定する
                    "Set-Cookie": [
                        `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                        `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                    ]
                },
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
                multiValueHeaders: {
                    "Content-Type": ["application/json"], // Content-Typeも配列にする
                    // Set-Cookieを配列として指定する
                    "Set-Cookie": [
                        `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                        `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                    ]
                },
                body: JSON.stringify({ message: "リクエストボディのJSON形式が正しくありません。" }),
            };
        }

        const { quizId } = body;

        if (!quizId) {
            return {
                statusCode: 400,
                multiValueHeaders: {
                    "Content-Type": ["application/json"], // Content-Typeも配列にする
                    // Set-Cookieを配列として指定する
                    "Set-Cookie": [
                        `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                        `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                    ]
                },
                body: JSON.stringify({ message: "quizIdは必須です。" }),
            };
        }

        // Get the current score item
        const getCommand = new GetCommand({
            TableName: SCORES_TABLE_NAME,
            Key: { QuizSessionId: quizId },
        });
        const { Item: score } = await docClient.send(getCommand);

        if (!score) {
            return {
                statusCode: 404,
                multiValueHeaders: {
                    "Content-Type": ["application/json"], // Content-Typeも配列にする
                    // Set-Cookieを配列として指定する
                    "Set-Cookie": [
                        `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                        `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                    ]
                },
                body: JSON.stringify({ message: "指定されたクイズセッションが見つかりません。" }),
            };
        }

        if (score.UserId !== authResult.userId) {
            return {
                statusCode: 403,
                multiValueHeaders: {
                    "Content-Type": ["application/json"], // Content-Typeも配列にする
                    // Set-Cookieを配列として指定する
                    "Set-Cookie": [
                        `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                        `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                    ]
                },
                body: JSON.stringify({ message: "Forbidden" }),
            };
        }

        let correctCount = 0;
        const updatedAnswers = score.Answers.map(answer => {
            const isCorrect = answer.SelectedChoice === answer.CorrectChoice;
            if (isCorrect) {
                correctCount++;
            }
            return { ...answer, IsCorrect: isCorrect };
        });

        const updateCommand = new UpdateCommand({
            TableName: SCORES_TABLE_NAME,
            Key: { QuizSessionId: quizId },
            UpdateExpression: "SET #answers = :answers, #correctCount = :correctCount, #submittedAt = :submittedAt",
            ExpressionAttributeNames: {
                '#answers': 'Answers',
                '#correctCount': 'CorrectCount',
                '#submittedAt': 'SubmittedAt'
            },
            ExpressionAttributeValues: {
                ":answers": updatedAnswers,
                ":correctCount": correctCount,
                ":submittedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
        });

        const { Attributes } = await docClient.send(updateCommand);
        return {
            statusCode: 200,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
                // Set-Cookieを配列として指定する
                "Set-Cookie": [
                    `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                    `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                ]
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
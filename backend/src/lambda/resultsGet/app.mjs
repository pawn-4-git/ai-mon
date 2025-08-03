import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;
const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!SCORES_TABLE_NAME || !QUESTIONS_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        const authResult = await validateSession(event);
        if (!authResult.isValid) {
            return authResult;
        }

        const quizSessionId = event.pathParameters?.quizSessionId;
        if (!quizSessionId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Quiz Session ID is required." }),
            };
        }

        // Get score data from ScoresTable
        const scoreCommand = new GetCommand({
            TableName: SCORES_TABLE_NAME,
            Key: {
                QuizSessionId: quizSessionId,
            },
        });
        const scoreResponse = await docClient.send(scoreCommand);
        const score = scoreResponse.Item;

        if (!score) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Quiz session not found." }),
            };
        }

        const questionNumberStr = event.queryStringParameters?.questionNumber;

        // If questionNumber is specified, return specific question details
        if (questionNumberStr) {
            const questionNumber = parseInt(questionNumberStr, 10);
            if (isNaN(questionNumber) || questionNumber <= 0 || questionNumber > score.questions.length) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Invalid question number." }),
                };
            }

            const questionInfo = score.questions[questionNumber - 1];
            
            // Get question details from QuestionsTable
            const questionCommand = new GetCommand({
                TableName: QUESTIONS_TABLE_NAME,
                Key: {
                    QuestionId: questionInfo.questionId,
                },
            });
            const questionResponse = await docClient.send(questionCommand);
            const question = questionResponse.Item;

            if (!question) {
                 return {
                    statusCode: 404,
                    body: JSON.stringify({ message: "Question details not found." }),
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    totalQuestions: score.questions.length,
                    questionText: question.QuestionText,
                    choices: question.Choices,
                    userChoice: questionInfo.userChoice,
                }),
            };
        }

        // If no questionNumber, return the full result
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Quiz results retrieved successfully.",
                results: score,
            }),
        };
    } catch (error) {
        console.error("Error retrieving quiz results:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

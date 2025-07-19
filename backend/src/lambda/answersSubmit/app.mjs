import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/nodejs/authHelper.js";

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

        const quizId = event.pathParameters?.quizId;
        if (!quizId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Quiz ID is required." }),
            };
        }

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing." }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error("JSON parsing error:", e);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format in request body." }),
            };
        }

        const { userId, answers, status } = body;
        
        if (!userId || !answers || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "UserId, answers, and status are required." }),
            };
        }

        let correctCount = 0;
        const answerResults = [];

        for (const answer of answers) {
            const getQuestionCommand = new GetCommand({
                TableName: QUESTIONS_TABLE_NAME,
                Key: {
                    QuestionId: answer.questionId,
                },
            });

            const questionResponse = await docClient.send(getQuestionCommand);
            
            if (questionResponse.Item) {
                const isCorrect = questionResponse.Item.CorrectChoice === answer.selectedChoice;
                if (isCorrect) correctCount++;
                
                answerResults.push({
                    questionId: answer.questionId,
                    selectedChoice: answer.selectedChoice,
                    correctChoice: questionResponse.Item.CorrectChoice,
                    isCorrect: isCorrect,
                });
            }
        }

        const score = Math.round((correctCount / answers.length) * 100);
        const now = new Date();

        const scoreItem = {
            ScoreId: randomUUID(),
            UserId: userId,
            QuizId: quizId,
            Score: score,
            CorrectCount: correctCount,
            TotalQuestions: answers.length,
            Status: status,
            SubmittedAt: now.toISOString(),
            Answers: answerResults,
        };

        const putCommand = new PutCommand({
            TableName: SCORES_TABLE_NAME,
            Item: scoreItem,
        });

        await docClient.send(putCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Quiz answers submitted successfully.",
                score: score,
                correctCount: correctCount,
                totalQuestions: answers.length,
                results: answerResults,
            }),
        };
    } catch (error) {
        console.error("Error submitting quiz answers:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

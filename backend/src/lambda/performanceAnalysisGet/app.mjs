import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/nodejs/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!SCORES_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        const authResult = await validateSession(event, false);
        if (!authResult.isValid) {
            return authResult;
        }

        const userId = event.pathParameters?.userId;
        if (!userId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "User ID is required." }),
            };
        }

        const queryCommand = new QueryCommand({
            TableName: SCORES_TABLE_NAME,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "UserId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
        });

        const response = await docClient.send(queryCommand);
        const scores = response.Items || [];

        if (scores.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "No performance data available.",
                    analysis: {
                        totalQuizzes: 0,
                        averageScore: 0,
                        bestScore: 0,
                        worstScore: 0,
                        improvement: 0,
                    },
                }),
            };
        }

        const totalQuizzes = scores.length;
        const totalScore = scores.reduce((sum, score) => sum + score.Score, 0);
        const averageScore = Math.round(totalScore / totalQuizzes);
        const bestScore = Math.max(...scores.map(s => s.Score));
        const worstScore = Math.min(...scores.map(s => s.Score));

        const sortedScores = scores.sort((a, b) => new Date(a.SubmittedAt || a.CreatedAt) - new Date(b.SubmittedAt || b.CreatedAt));
        const recentScores = sortedScores.slice(-5);
        const olderScores = sortedScores.slice(0, -5);

        let improvement = 0;
        if (olderScores.length > 0 && recentScores.length > 0) {
            const recentAvg = recentScores.reduce((sum, s) => sum + s.Score, 0) / recentScores.length;
            const olderAvg = olderScores.reduce((sum, s) => sum + s.Score, 0) / olderScores.length;
            improvement = Math.round(recentAvg - olderAvg);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Performance analysis retrieved successfully.",
                analysis: {
                    totalQuizzes,
                    averageScore,
                    bestScore,
                    worstScore,
                    improvement,
                    recentPerformance: recentScores.map(s => ({
                        quizId: s.QuizId,
                        score: s.Score,
                        date: s.SubmittedAt || s.CreatedAt,
                    })),
                },
            }),
        };
    } catch (error) {
        console.error("Error retrieving performance analysis:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

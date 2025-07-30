import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/authHelper.js";

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
        const authResult = await validateSession(event);
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

        const { quizId, score, date } = body;
        
        if (!quizId || score === undefined || !date) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "QuizId, score, and date are required." }),
            };
        }

        const scoreId = randomUUID();
        const now = new Date();

        const scoreItem = {
            ScoreId: scoreId,
            UserId: userId,
            QuizId: quizId,
            Score: score,
            Date: date,
            CreatedAt: now.toISOString(),
        };

        const putCommand = new PutCommand({
            TableName: SCORES_TABLE_NAME,
            Item: scoreItem,
        });

        await docClient.send(putCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Score record created successfully.",
                ScoreId: scoreId,
                ...scoreItem,
            }),
        };
    } catch (error) {
        console.error("Error creating score record:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

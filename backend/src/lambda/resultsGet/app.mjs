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

        const queryCommand = new QueryCommand({
            TableName: SCORES_TABLE_NAME,
            IndexName: "QuizIdIndex",
            KeyConditionExpression: "QuizId = :quizId",
            ExpressionAttributeValues: {
                ":quizId": quizId,
            },
        });

        const response = await docClient.send(queryCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Quiz results retrieved successfully.",
                results: response.Items || [],
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

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/nodejs/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!QUESTIONS_TABLE_NAME) {
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

        const questionId = event.pathParameters?.questionId;
        if (!questionId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Question ID is required." }),
            };
        }

        const getCommand = new GetCommand({
            TableName: QUESTIONS_TABLE_NAME,
            Key: {
                QuestionId: questionId,
            },
        });

        const response = await docClient.send(getCommand);

        if (!response.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Question not found." }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Question retrieved successfully.",
                question: response.Item,
            }),
        };
    } catch (error) {
        console.error("Error retrieving question:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

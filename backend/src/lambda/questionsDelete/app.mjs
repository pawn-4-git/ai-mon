import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

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

        const deleteCommand = new DeleteCommand({
            TableName: QUESTIONS_TABLE_NAME,
            Key: {
                QuestionId: questionId,
            },
        });

        await docClient.send(deleteCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Question deleted successfully.",
            }),
        };
    } catch (error) {
        console.error("Error deleting question:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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

        const scoreId = event.pathParameters?.scoreId;
        if (!scoreId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Score ID is required." }),
            };
        }

        const deleteCommand = new DeleteCommand({
            TableName: SCORES_TABLE_NAME,
            Key: {
                ScoreId: scoreId,
            },
        });

        await docClient.send(deleteCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Score record deleted successfully.",
            }),
        };
    } catch (error) {
        console.error("Error deleting score record:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/nodejs/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RESOURCES_TABLE_NAME = process.env.RESOURCES_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!RESOURCES_TABLE_NAME) {
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

        const resourceId = event.pathParameters?.resourceId;
        if (!resourceId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Resource ID is required." }),
            };
        }

        const deleteCommand = new DeleteCommand({
            TableName: RESOURCES_TABLE_NAME,
            Key: {
                ResourceId: resourceId,
            },
        });

        await docClient.send(deleteCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Resource deleted successfully.",
            }),
        };
    } catch (error) {
        console.error("Error deleting resource:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

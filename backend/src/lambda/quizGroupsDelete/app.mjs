import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUIZ_GROUPS_TABLE_NAME = process.env.QUIZ_GROUPS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!QUIZ_GROUPS_TABLE_NAME) {
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

        const groupId = event.pathParameters?.groupId;
        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Group ID is required." }),
            };
        }

        const deleteCommand = new DeleteCommand({
            TableName: QUIZ_GROUPS_TABLE_NAME,
            Key: {
                GroupId: groupId,
            },
        });

        await docClient.send(deleteCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Quiz group deleted successfully.",
            }),
        };
    } catch (error) {
        console.error("Error deleting quiz group:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
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

        const getCommand = new GetCommand({
            TableName: QUIZ_GROUPS_TABLE_NAME,
            Key: {
                GroupId: groupId,
            },
        });

        const response = await docClient.send(getCommand);

        if (!response.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Quiz group not found." }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Quiz group retrieved successfully.",
                group: response.Item,
            }),
        };
    } catch (error) {
        console.error("Error retrieving quiz group:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

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

        const groupId = event.pathParameters?.groupId;
        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Group ID is required." }),
            };
        }

        const queryCommand = new QueryCommand({
            TableName: RESOURCES_TABLE_NAME,
            IndexName: "GroupIdIndex",
            KeyConditionExpression: "GroupId = :groupId",
            ExpressionAttributeValues: {
                ":groupId": groupId,
            },
        });

        const response = await docClient.send(queryCommand);

        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const shuffledItems = response.Items ? shuffle([...response.Items]) : [];

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Resources retrieved successfully.",
                resources: shuffledItems,
            }),
        };
    } catch (error) {
        console.error("Error retrieving resources:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RESOURCES_TABLE_NAME = process.env.RESOURCES_TABLE_NAME;
const QUIZ_GROUPS_TABLE_NAME = process.env.QUIZ_GROUPS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    // const sessionValidation = await validateSession(event);
    // if (!sessionValidation.isValid) {
    //     return {
    //         statusCode: 401,
    //         body: JSON.stringify({ message: "Unauthorized" }),
    //     };
    // }

    if (!RESOURCES_TABLE_NAME || !QUIZ_GROUPS_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        const quizGroupsScanCommand = new ScanCommand({
            TableName: QUIZ_GROUPS_TABLE_NAME,
        });
        const quizGroupsResponse = await docClient.send(quizGroupsScanCommand);
        const quizGroups = quizGroupsResponse.Items || [];

        const resourcesByGroup = {};

        for (const group of quizGroups) {
            const resourcesQueryCommand = new QueryCommand({
                TableName: RESOURCES_TABLE_NAME,
                IndexName: "GroupIdIndex",
                KeyConditionExpression: "GroupId = :groupId",
                ExpressionAttributeValues: {
                    ":groupId": group.GroupId,
                },
                Limit: 10,
            });
            const resourcesResponse = await docClient.send(resourcesQueryCommand);
            if (resourcesResponse.Items && resourcesResponse.Items.length > 0) {
                resourcesByGroup[group.GroupId] = {
                    GroupName: group.GroupName,
                    resources: resourcesResponse.Items || []
                };
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Resources retrieved successfully by group.",
                resourcesByGroup,
            }),
        };
    } catch (error) {
        console.error("Error retrieving resources by group:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

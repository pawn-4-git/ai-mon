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
        const quizGroups = [];
        let ExclusiveStartKey;
        do {
            const command = new ScanCommand({ TableName: QUIZ_GROUPS_TABLE_NAME, ExclusiveStartKey });
            const response = await docClient.send(command);
            quizGroups.push(...(response.Items || []));
            ExclusiveStartKey = response.LastEvaluatedKey;
        } while (ExclusiveStartKey);

        const resourcesByGroup = {};

        const queryPromises = quizGroups.map(group => {
            const command = new QueryCommand({
                TableName: RESOURCES_TABLE_NAME,
                IndexName: "GroupIdIndex",
                KeyConditionExpression: "GroupId = :groupId",
                ExpressionAttributeValues: {
                    ":groupId": group.GroupId,
                },
                Limit: 10,
            });
            return docClient.send(command).then(response => ({
                group: group,
                resources: response.Items || []
            }));
        });

        const results = await Promise.all(queryPromises);

        for (const result of results) {
            if (result.resources.length > 0) {
                resourcesByGroup[result.group.GroupId] = {
                    GroupName: result.group.GroupName,
                    resources: result.resources
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

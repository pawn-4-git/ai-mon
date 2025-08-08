import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";
import { updateSessionTtl } from "/opt/userHelper.js";

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

        const userId = authResult.userId;
        if (!userId) {
            // This case should technically not be reached if validateSession is working correctly
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "User ID could not be determined from session." }),
            };
        }

        const queryCommand = new QueryCommand({
            TableName: SCORES_TABLE_NAME,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "UserId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
            ScanIndexForward: false,
        });

        const response = await docClient.send(queryCommand);
        const items = response.Items || [];

        const latestScoresByGroup = {};
        for (const item of items) {
            if (!latestScoresByGroup[item.GroupId]) {
                latestScoresByGroup[item.GroupId] = item;
            }
        }

        const uniqueLatestScores = Object.values(latestScoresByGroup);

        return {
            statusCode: 200,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
            },
            body: JSON.stringify({
                message: "Score history retrieved successfully.",
                scores: uniqueLatestScores,
            }),
        };
    } catch (error) {
        console.error("Error retrieving score history:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

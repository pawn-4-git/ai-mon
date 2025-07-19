import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/nodejs/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!USERS_TABLE_NAME || !SESSIONS_TABLE_NAME) {
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

        const userId = event.pathParameters?.userId;
        if (!userId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "User ID is required." }),
            };
        }

        const deleteUserCommand = new DeleteCommand({
            TableName: USERS_TABLE_NAME,
            Key: {
                UserId: userId,
            },
        });

        const deleteSessionsCommand = new QueryCommand({
            TableName: SESSIONS_TABLE_NAME,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "UserId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
        });

        const sessionsResponse = await docClient.send(deleteSessionsCommand);
        
        if (sessionsResponse.Items) {
            for (const session of sessionsResponse.Items) {
                const deleteSessionCommand = new DeleteCommand({
                    TableName: SESSIONS_TABLE_NAME,
                    Key: {
                        SessionId: session.SessionId,
                    },
                });
                await docClient.send(deleteSessionCommand);
            }
        }

        await docClient.send(deleteUserCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "User deleted successfully.",
            }),
        };
    } catch (error) {
        console.error("Error processing user deletion request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

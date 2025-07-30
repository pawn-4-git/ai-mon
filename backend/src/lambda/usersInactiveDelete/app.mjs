import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

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

        const now = Math.floor(Date.now() / 1000);
        let deletedCount = 0;

        const scanCommand = new ScanCommand({
            TableName: USERS_TABLE_NAME,
            FilterExpression: "ExpiresAt < :now",
            ExpressionAttributeValues: {
                ":now": now,
            },
        });

        const response = await docClient.send(scanCommand);
        const expiredUsers = response.Items || [];

        for (const user of expiredUsers) {
            const deleteUserCommand = new DeleteCommand({
                TableName: USERS_TABLE_NAME,
                Key: {
                    UserId: user.UserId,
                },
            });

            await docClient.send(deleteUserCommand);
            deletedCount++;

            const deleteSessionsCommand = new ScanCommand({
                TableName: SESSIONS_TABLE_NAME,
                FilterExpression: "UserId = :userId",
                ExpressionAttributeValues: {
                    ":userId": user.UserId,
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
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Inactive users deleted successfully.",
                deletedCount: deletedCount,
            }),
        };
    } catch (error) {
        console.error("Error deleting inactive users:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

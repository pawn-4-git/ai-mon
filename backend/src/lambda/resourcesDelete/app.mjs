import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";
import { isAdmin } from "/opt/authHelper.js";
import { updateSessionTtl } from "/opt/userHelper.js";

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

        // Check if the user is an administrator
        if (!await isAdmin(authResult.userId)) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "Only administrators can perform this action." }),
            };
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
        const newSession = await updateSessionTtl(authResult.sessionId);

        return {
            statusCode: 200,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
                // Set-Cookieを配列として指定する
                "Set-Cookie": [
                    `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                    `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                ]
            },
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

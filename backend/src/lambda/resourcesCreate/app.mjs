import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/authHelper.js";
import { isAdmin } from "/opt/authHelper.js";

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

        const groupId = event.pathParameters?.groupId;
        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Group ID is required." }),
            };
        }

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing." }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error("JSON parsing error:", e);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format in request body." }),
            };
        }

        const { url, title, imgSrc } = body;

        if (!url || !title) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "URL and title are required." }),
            };
        }

        const resourceId = randomUUID();
        const now = new Date();

        const resourceItem = {
            ResourceId: resourceId,
            GroupId: groupId,
            URL: url,
            Title: title,
            ImgSrc: imgSrc || null,
            CreatedAt: now.toISOString(),
            CreatedBy: authResult.userId,
        };

        const putCommand = new PutCommand({
            TableName: RESOURCES_TABLE_NAME,
            Item: resourceItem,
        });

        await docClient.send(putCommand);
        const newSession = await updateSessionTtl(authResult.sessionId);

        return {
            statusCode: 201,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
                // Set-Cookieを配列として指定する
                "Set-Cookie": [
                    `sessionId=${authResult.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                    `sessionVersionId=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                ]
            },
            body: JSON.stringify({
                message: "Resource created successfully.",
                ResourceId: resourceId,
                ...resourceItem,
            }),
        };
    } catch (error) {
        console.error("Error creating resource:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

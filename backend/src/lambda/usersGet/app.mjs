import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.match(/(.*?)=(.*)$/)
            if (parts) {
                cookies[parts[1].trim()] = (parts[2] || '').trim();
            }
        });
    }
    return cookies;
};

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
        if (authResult.isValid) {
            return authResult;
        }
        const userId = authResult.userId;

        // --- User Lookup ---
        const getUserCommand = new GetCommand({
            TableName: USERS_TABLE_NAME,
            Key: {
                "UserId": userId,
            },
        });

        const userResult = await docClient.send(getUserCommand);

        if (!userResult.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        const accountName = userResult.Item.AccountName;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                AccountName: accountName
            }),
        };
    } catch (error) {
        console.error("Error processing get user request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error during get user process." }),
        };
    }
};
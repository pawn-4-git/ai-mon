import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const SESSION_TTL_DAYS = 1;

const calculateTtl = (baseDate, days) => {
    const ttlDate = new Date(baseDate);
    ttlDate.setDate(ttlDate.getDate() + days);
    // DynamoDB TTL expects a Unix timestamp (seconds since epoch)
    return Math.floor(ttlDate.getTime() / 1000);
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

        const accountName = body.accountName?.trim();
        if (!accountName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "AccountName is required." }),
            };
        }

        // --- User Lookup using AccountNameIndex ---
        const queryUserCommand = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            IndexName: "AccountNameIndex", // Specify the GSI name
            KeyConditionExpression: "accountName = :accName", // Use accountName as the key condition
            ExpressionAttributeValues: {
                ":accName": accountName, // Use the provided accountName
            },
            Limit: 1, // Expecting a unique accountName
        });

        const userQueryResult = await docClient.send(queryUserCommand);

        if (!userQueryResult.Items || userQueryResult.Items.length === 0) {
            console.log(`User not found for accountName: ${accountName}`);
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        const userItem = userQueryResult.Items[0];
        const userId = userItem.UserId; // Assuming UserId is projected or part of the item

        if (!userId) {
            console.error(`UserId not found in the user item for accountName: ${accountName}`);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Internal server error: User ID not found." }),
            };
        }

        // --- Session Creation ---
        const now = new Date();
        const sessionId = randomUUID();
        const sessionVersionId = randomUUID(); // Generate sessionVersionId
        const sessionTtlTimestamp = calculateTtl(now, SESSION_TTL_DAYS);

        const sessionItem = {
            SessionId: sessionId,
            UserId: userId,
            CreatedAt: now.toISOString(),
            ExpiresAt: sessionTtlTimestamp,
            SessionVersionId: sessionVersionId, // Add SessionVersionId to the item
        };

        const putSessionCommand = new PutCommand({
            TableName: SESSIONS_TABLE_NAME,
            Item: sessionItem,
        });

        await docClient.send(putSessionCommand);

        return {
            statusCode: 200,
            multiValueHeaders: {
                "Content-Type": ["application/json"], // Content-Typeも配列にする
                // Set-Cookieを配列として指定する
                "Set-Cookie": [
                    `username=${accountName}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                    `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                    `sessionVersionId=${sessionVersionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
                ]
            },
            body: JSON.stringify({
                message: "Login successful."
            }),
        };
    } catch (error) {
        console.error("Error processing login request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error during login process." }),
        };
    }
};
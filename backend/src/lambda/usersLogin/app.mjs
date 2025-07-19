import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const SESSION_TTL_DAYS = 1;
const ACCOUNT_NAME_UNIQUE_PREFIX = 'UNAME#';

const calculateTtl = (baseDate, days) => {
    const ttlDate = new Date(baseDate);
    ttlDate.setDate(ttlDate.getDate() + days);
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

        const queryCommand = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            KeyConditionExpression: "UserId = :userId",
            ExpressionAttributeValues: {
                ":userId": `${ACCOUNT_NAME_UNIQUE_PREFIX}${accountName}`,
            },
        });

        const queryResponse = await docClient.send(queryCommand);
        
        if (!queryResponse.Items || queryResponse.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        const userUniqueItem = queryResponse.Items[0];
        
        const getUserCommand = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            KeyConditionExpression: "UserId = :userId",
            ExpressionAttributeValues: {
                ":userId": userUniqueItem.UserId.replace(ACCOUNT_NAME_UNIQUE_PREFIX, ''),
            },
        });

        const userResponse = await docClient.send(getUserCommand);
        
        if (!userResponse.Items || userResponse.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        const user = userResponse.Items[0];
        const now = new Date();
        const sessionId = randomUUID();
        const sessionVersionId = randomUUID();
        const sessionTtlTimestamp = calculateTtl(now, SESSION_TTL_DAYS);

        const sessionItem = {
            SessionId: sessionId,
            UserId: user.UserId,
            ExpiresAt: sessionTtlTimestamp,
            SessionVersionId: sessionVersionId,
        };

        const putSessionCommand = new PutCommand({
            TableName: SESSIONS_TABLE_NAME,
            Item: sessionItem,
        });

        await docClient.send(putSessionCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Login successful.",
                UserId: user.UserId,
                SessionId: sessionId,
                SessionVersionId: sessionVersionId,
            }),
        };
    } catch (error) {
        console.error("Error processing login request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

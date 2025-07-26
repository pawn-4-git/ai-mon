import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { updateUserTtl } from "./userHelper.js";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;
const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

const getCookieValue = (cookieHeader, cookieName) => {
    if (!cookieHeader) return undefined;
    const match = cookieHeader.match(new RegExp(`(?:^|;\s*)${cookieName}=([^;]*)`));
    return match ? match[1] : undefined;
};

export const validateSession = async (event) => {
    if (!SESSIONS_TABLE_NAME) {
        throw new Error("SESSIONS_TABLE_NAME environment variable is not set.");
    }

    const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
    const sessionId = getCookieValue(cookieHeader, 'sessionId');
    const sessionVersionId = getCookieValue(cookieHeader, 'sessionVersionId');


    if (!sessionId) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Session ID not found in cookie." }),
        };
    }

    try {
        const command = new GetCommand({
            TableName: SESSIONS_TABLE_NAME,
            Key: {
                SessionId: sessionId,
            },
        });

        const response = await docClient.send(command);

        if (!response.Item) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Invalid session." }),
            };
        }

        const session = response.Item;

        if (session.SessionVersionId !== sessionVersionId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Session version mismatch." }),
            };
        }

        const now = Math.floor(Date.now() / 1000);

        if (session.ExpiresAt <= now) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Session expired." }),
            };
        }

        await updateUserTtl(session.UserId);

        const newSessionVersionId = randomUUID();
        const newExpiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 1 day from now
        const updateCommand = new UpdateCommand({
            TableName: SESSIONS_TABLE_NAME,
            Key: {
                SessionId: sessionId,
            },
            UpdateExpression: "set SessionVersionId = :v, ExpiresAt = :e",
            ExpressionAttributeValues: {
                ":v": newSessionVersionId,
                ":e": newExpiresAt,
            },
        });
        await docClient.send(updateCommand);

        return {
            isValid: true,
            userId: session.UserId,
            sessionId: sessionId,
            newSessionVersionId: newSessionVersionId,
        };
    } catch (error) {
        console.error("Error validating session:", error);
        throw error;
    }
};

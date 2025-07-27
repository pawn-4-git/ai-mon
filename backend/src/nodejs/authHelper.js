import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const getCookieValue = (cookieHeader, cookieName) => {
    if (!cookieHeader) return undefined;
    const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]*)`));
    return match ? match[1] : undefined;
};

export const validateSession = async (event) => {
    if (!SESSIONS_TABLE_NAME) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Session table configuration is missing." }),
        };
    }

    const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
    const sessionId = getCookieValue(cookieHeader, 'sessionId');
    const sessionVersionId = getCookieValue(cookieHeader, 'sessionVersionId');

    if (!sessionId || !sessionVersionId) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized: Missing session credentials." }),
        };
    }

    try {
        const command = new GetCommand({
            TableName: SESSIONS_TABLE_NAME,
            Key: { SessionId: sessionId },
        });

        const response = await docClient.send(command);

        if (!response.Item) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Invalid session." }),
            };
        }

        const session = response.Item;

        if (session.SessionVersionId !== sessionVersionId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Session version mismatch." }),
            };
        }

        const now = Math.floor(Date.now() / 1000);
        if (session.ExpiresAt <= now) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Session expired." }),
            };
        }
        return {
            statusCode: 200,
            userId: session.UserId,
            newSessionVersionId: sessionVersionId,
        };

    } catch (error) {
        console.error("Error during user authentication:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error during authentication." }),
        };
    }
};

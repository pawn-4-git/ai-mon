import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { updateUserTtl } from "./userHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

export const validateSession = async (event) => {
    if (!SESSIONS_TABLE_NAME) {
        throw new Error("SESSIONS_TABLE_NAME environment variable is not set.");
    }

    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Authorization header is missing." }),
        };
    }

    const sessionId = authHeader.replace(/^Bearer\s+/, '');
    if (!sessionId) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Invalid authorization format." }),
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
        const now = Math.floor(Date.now() / 1000);
        
        if (session.ExpiresAt <= now) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Session expired." }),
            };
        }

        await updateUserTtl(session.UserId);

        return {
            isValid: true,
            userId: session.UserId,
            sessionId: sessionId,
        };
    } catch (error) {
        console.error("Error validating session:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

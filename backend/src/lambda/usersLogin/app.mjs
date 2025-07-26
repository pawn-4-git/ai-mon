import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

const SESSION_TTL_DAYS = 1;
// ACCOUNT_NAME_UNIQUE_PREFIX is no longer needed for the query itself, but might be relevant for the UserId in the session table.

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

        // Assuming the first item is the correct user and it contains the actual UserId
        const userItem = userQueryResult.Items[0];
        // We need the UserId to create the session. Assuming userItem.UserId exists.
        // If UserId is not directly available in the item returned by the GSI query,
        // you might need to adjust this part based on what the GSI returns.
        // For example, if the GSI only returns accountName and a different identifier,
        // you might need another query to UsersTable using the primary key to get the UserId.
        // However, typically, GSI projection includes the primary key attributes, so UserId should be available.
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
        const sessionTtlTimestamp = calculateTtl(now, SESSION_TTL_DAYS);

        const sessionItem = {
            SessionId: sessionId, // Assuming SessionId is the partition key for SessionsTable
            UserId: userId,       // Assuming UserId is a sort key or attribute in SessionsTable
            CreatedAt: now.toISOString(), // Store as ISO string for better readability and compatibility
            ExpiresAt: sessionTtlTimestamp, // Unix timestamp in seconds
            // Add any other attributes required by SessionsTable schema
            // e.g., SessionVersionId: randomUUID(),
        };

        const putSessionCommand = new PutCommand({
            TableName: SESSIONS_TABLE_NAME,
            Item: sessionItem,
        });

        await docClient.send(putSessionCommand);

        console.log(`Session created for UserId: ${userId}, SessionId: ${sessionId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Login successful.",
                UserId: userId,
                SessionId: sessionId,
                // Include other relevant session details if needed
            }),
        };
    } catch (error) {
        console.error("Error processing login request:", error);
        // Provide a more specific error message if possible, but avoid leaking sensitive info
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error during login process." }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";
import { isAdmin } from "/opt/authHelper.js";
import { updateSessionTtl } from "/opt/userHelper.js";


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUIZ_GROUPS_TABLE_NAME = process.env.QUIZ_GROUPS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!QUIZ_GROUPS_TABLE_NAME) {
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

        const updateExpressions = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};

        if (body.name) {
            updateExpressions.push("#name = :name");
            expressionAttributeNames["#name"] = "Name";
            expressionAttributeValues[":name"] = body.name;
        }

        if (body.questionCount) {
            updateExpressions.push("QuestionCount = :questionCount");
            expressionAttributeValues[":questionCount"] = body.questionCount;
        }

        if (body.timeLimitMinutes) {
            updateExpressions.push("TimeLimitMinutes = :timeLimitMinutes");
            expressionAttributeValues[":timeLimitMinutes"] = body.timeLimitMinutes;
        }

        if (updateExpressions.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No valid fields to update." }),
            };
        }

        updateExpressions.push("UpdatedAt = :updatedAt");
        expressionAttributeValues[":updatedAt"] = new Date().toISOString();

        const updateCommand = new UpdateCommand({
            TableName: QUIZ_GROUPS_TABLE_NAME,
            Key: {
                GroupId: groupId,
            },
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateCommand);
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
                message: "Quiz group updated successfully.",
                group: response.Attributes,
            }),
        };
    } catch (error) {
        console.error("Error updating quiz group:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

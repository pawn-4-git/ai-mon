import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession, isAdmin } from "/opt/authHelper.js";
import { updateUserTtl, updateSessionTtl } from "/opt/userHelper.js";

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

        if (!(await isAdmin(authResult.userId))) {
            return {
                statusCode: 403, // 401 Unauthorized から 403 Forbidden に変更する方がより適切
                body: JSON.stringify({ message: "Forbidden: You do not have permission to perform this action." }),
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

        const { name, questionCount, timeLimitMinutes } = body;

        if (!name || !questionCount || !timeLimitMinutes) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Name, questionCount, and timeLimitMinutes are required." }),
            };
        }

        const groupId = randomUUID();
        const now = new Date();

        const quizGroupItem = {
            GroupId: groupId,
            Name: name,
            QuestionCount: questionCount,
            TimeLimitMinutes: timeLimitMinutes,
            CreatedAt: now.toISOString(),
            CreatedBy: authResult.userId,
        };

        const putCommand = new PutCommand({
            TableName: QUIZ_GROUPS_TABLE_NAME,
            Item: quizGroupItem,
        });

        await docClient.send(putCommand);

        await updateUserTtl(authResult.userId);
        await updateSessionTtl(authResult.sessionId);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Quiz group created successfully.",
                GroupId: groupId,
                ...quizGroupItem,
            }),
        };
    } catch (error) {
        console.error("Error creating quiz group:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

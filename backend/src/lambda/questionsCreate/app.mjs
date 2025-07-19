import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/nodejs/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

export const lambdaHandler = async (event) => {
    if (!QUESTIONS_TABLE_NAME) {
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

        const { type } = body;
        
        if (!type || (type !== "manual" && type !== "auto")) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Type must be 'manual' or 'auto'." }),
            };
        }

        const questionId = randomUUID();
        const now = new Date();

        let questionItem = {
            QuestionId: questionId,
            GroupId: groupId,
            Type: type,
            CreatedAt: now.toISOString(),
            CreatedBy: authResult.userId,
        };

        if (type === "manual") {
            const { questionText, correctChoice, incorrectChoices, explanation } = body;
            
            if (!questionText || !correctChoice || !incorrectChoices || !explanation) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "QuestionText, correctChoice, incorrectChoices, and explanation are required for manual questions." }),
                };
            }

            questionItem = {
                ...questionItem,
                QuestionText: questionText,
                CorrectChoice: correctChoice,
                IncorrectChoices: incorrectChoices,
                Explanation: explanation,
            };
        } else if (type === "auto") {
            const { sourceText, title } = body;
            
            if (!sourceText || !title) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "SourceText and title are required for auto-generated questions." }),
                };
            }

            questionItem = {
                ...questionItem,
                SourceText: sourceText,
                Title: title,
                Status: "pending",
            };
        }

        const putCommand = new PutCommand({
            TableName: QUESTIONS_TABLE_NAME,
            Item: questionItem,
        });

        await docClient.send(putCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Question created successfully.",
                QuestionId: questionId,
                ...questionItem,
            }),
        };
    } catch (error) {
        console.error("Error creating question:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

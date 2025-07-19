import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

        const questionId = event.pathParameters?.questionId;
        if (!questionId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Question ID is required." }),
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

        if (body.questionText) {
            updateExpressions.push("QuestionText = :questionText");
            expressionAttributeValues[":questionText"] = body.questionText;
        }

        if (body.correctChoice) {
            updateExpressions.push("CorrectChoice = :correctChoice");
            expressionAttributeValues[":correctChoice"] = body.correctChoice;
        }

        if (body.incorrectChoices) {
            updateExpressions.push("IncorrectChoices = :incorrectChoices");
            expressionAttributeValues[":incorrectChoices"] = body.incorrectChoices;
        }

        if (body.explanation) {
            updateExpressions.push("Explanation = :explanation");
            expressionAttributeValues[":explanation"] = body.explanation;
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
            TableName: QUESTIONS_TABLE_NAME,
            Key: {
                QuestionId: questionId,
            },
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Question updated successfully.",
                question: response.Attributes,
            }),
        };
    } catch (error) {
        console.error("Error updating question:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/authHelper.js";

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

        const { sourceText, groupId } = body;
        
        if (!sourceText || !groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "SourceText and groupId are required." }),
            };
        }

        const questionId = randomUUID();
        const now = new Date();

        const generatedQuestion = {
            questionText: `Generated question from: ${sourceText.substring(0, 100)}...`,
            correctChoice: "Generated correct answer",
            incorrectChoices: [
                "Generated incorrect answer 1",
                "Generated incorrect answer 2",
                "Generated incorrect answer 3"
            ],
            explanation: "This is a generated explanation for the question."
        };

        const questionItem = {
            QuestionId: questionId,
            GroupId: groupId,
            Type: "auto",
            SourceText: sourceText,
            QuestionText: generatedQuestion.questionText,
            CorrectChoice: generatedQuestion.correctChoice,
            IncorrectChoices: generatedQuestion.incorrectChoices,
            Explanation: generatedQuestion.explanation,
            CreatedAt: now.toISOString(),
            CreatedBy: authResult.userId,
            Status: "generated",
        };

        const putCommand = new PutCommand({
            TableName: QUESTIONS_TABLE_NAME,
            Item: questionItem,
        });

        await docClient.send(putCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Question generated successfully.",
                QuestionId: questionId,
                questionText: generatedQuestion.questionText,
                correctChoice: generatedQuestion.correctChoice,
                incorrectChoices: generatedQuestion.incorrectChoices,
                explanation: generatedQuestion.explanation,
            }),
        };
    } catch (error) {
        console.error("Error generating question:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

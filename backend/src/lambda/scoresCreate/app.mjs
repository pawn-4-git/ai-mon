import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;
const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;
const QUIZ_GROUPS_TABLE_NAME = process.env.QUIZ_GROUPS_TABLE_NAME;

// Function to shuffle an array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const lambdaHandler = async (event) => {
    if (!SCORES_TABLE_NAME || !QUESTIONS_TABLE_NAME || !QUIZ_GROUPS_TABLE_NAME) {
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

        const userId = authResult.userId;
        if (!userId) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "User ID could not be determined from session." }),
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

        const { groupId } = body;
        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "groupId is required." }),
            };
        }

        const currentTime = new Date().toISOString();
        // Search for an existing score that is not submitted and not expired
        const queryScoresParams = {
            TableName: SCORES_TABLE_NAME,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "UserId = :userId",
            FilterExpression: "GroupId = :groupId AND attribute_not_exists(SubmittedAt) AND ExpiresAt > :currentTime",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":groupId": groupId,
                ":currentTime": currentTime,
            },
        };

        const queryScoresCommand = new QueryCommand(queryScoresParams);
        const queryScoresResult = await docClient.send(queryScoresCommand);

        const activeSession = queryScoresResult.Items.find(item => {
            const expiresAt = new Date(item.ExpiresAt);
            return expiresAt > new Date();
        });

        if (activeSession) {
            return {
                statusCode: 200,
                body: JSON.stringify({ QuizSessionId: activeSession.QuizSessionId }),
            };
        }

        // --- Create a new score if no active one is found ---

        // 1. Fetch Quiz Group details
        const getGroupParams = {
            TableName: QUIZ_GROUPS_TABLE_NAME,
            Key: { GroupId: groupId },
        };
        const getGroupCommand = new GetCommand(getGroupParams);
        const groupResult = await docClient.send(getGroupCommand);

        if (!groupResult.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Quiz group not found." }),
            };
        }
        const { TimeLimitMinutes = 60, QuestionCount = 10 } = groupResult.Item;

        // 2. Fetch all questions for the given groupId
        const queryQuestionsParams = {
            TableName: QUESTIONS_TABLE_NAME,
            IndexName: "GroupIdIndex",
            KeyConditionExpression: "GroupId = :groupId",
            ExpressionAttributeValues: {
                ":groupId": groupId,
            },
        };
        const queryQuestionsCommand = new QueryCommand(queryQuestionsParams);
        const questionsResult = await docClient.send(queryQuestionsCommand);

        if (!questionsResult.Items || questionsResult.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "No questions found for the provided groupId." }),
            };
        }

        // 3. Generate the Answers array (select a subset of questions)
        const selectedQuestions = shuffleArray(questionsResult.Items).slice(0, QuestionCount);

        const answers = selectedQuestions.map(q => {
            const incorrectChoices = [...q.IncorrectChoices];
            const shuffledIncorrect = shuffleArray(incorrectChoices).slice(0, 3);
            const finalChoices = shuffleArray([q.CorrectChoice, ...shuffledIncorrect]);

            return {
                QuestionId: q.QuestionId,
                QuestionText: q.QuestionText,
                Choices: finalChoices,
                CorrectChoice: q.CorrectChoice,
                SelectedChoice: null,
                IsCorrect: null,
                Explanation: q.Explanation,
                AfterCheck: null,
            };
        });

        // 4. Create the new score item
        const quizSessionId = randomUUID();
        const now = new Date();
        const expires = new Date(now.getTime() + TimeLimitMinutes * 60 * 1000);

        const newScoreItem = {
            QuizSessionId: quizSessionId,
            UserId: userId,
            GroupId: groupId,
            Answers: answers,
            TotalCount: answers.length,
            StartedAt: now.toISOString(),
            ExpiresAt: expires.toISOString(),
        };

        const putCommand = new PutCommand({
            TableName: SCORES_TABLE_NAME,
            Item: newScoreItem,
        });

        await docClient.send(putCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({ QuizSessionId: newScoreItem.QuizSessionId }),
        };
    } catch (error) {
        console.error("Error in scoresCreate:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

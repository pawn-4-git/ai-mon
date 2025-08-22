import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE_NAME = process.env.SCORES_TABLE_NAME;
const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;
const QUIZ_GROUPS_TABLE_NAME = process.env.QUIZ_GROUPS_TABLE_NAME;
const ANSWER_WINDOW_SIZE = 30;

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

        const quizSessionId = event.pathParameters?.quizSessionId;
        if (!quizSessionId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Quiz Session ID is required." }),
            };
        }

        // Get score data from ScoresTable
        const scoreCommand = new GetCommand({
            TableName: SCORES_TABLE_NAME,
            Key: {
                QuizSessionId: quizSessionId,
            },
        });
        const scoreResponse = await docClient.send(scoreCommand);
        const score = scoreResponse.Item;

        if (!score) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Quiz session not found." }),
            };
        }

        if (score.UserId !== authResult.userId) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "Forbidden" }),
            };
        }

        const now = Math.floor(Date.now() / 1000);
        const isExpired = score.ExpiresAt && now > score.ExpiresAt;

        // Process answers to set CorrectChoice to empty string if not expired
        const processedAnswersList = score.Answers.map(answer =>
            isExpired ? answer : { ...answer, CorrectChoice: '' }
        );
        
        // Replace original answers with processed ones
        const processedScore = { ...score, Answers: processedAnswersList };

        // Get group name from QuizGroupsTable
        const groupCommand = new GetCommand({
            TableName: QUIZ_GROUPS_TABLE_NAME,
            Key: {
                GroupId: score.GroupId,
            },
        });
        const groupResponse = await docClient.send(groupCommand);
        const groupItem = groupResponse.Item;
        if (!groupItem) {
            console.warn(`Group with ID ${score.GroupId} not found in QuizGroupsTable.`);
        }
        const groupName = groupItem?.Name || "Unknown Group";

        const questionNumberStr = event.queryStringParameters?.questionNumber;

        // If questionNumber is specified, return specific question details
        if (questionNumberStr) {
            const questionNumber = parseInt(questionNumberStr, 10) - 1;

            if (isNaN(questionNumber) || questionNumber < 0 || questionNumber > processedScore.TotalCount) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Invalid question number." }),
                };
            }

            const questionInfo = processedScore.Answers.find(a => a.QuestionNumber === questionNumber);
            if (!questionInfo) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: "Question not found." }),
                };
            }

            // questionNumberを基準に、前後30問の範囲を計算
            const start = Math.max(0, questionNumber - ANSWER_WINDOW_SIZE);
            const end = Math.min(processedScore.TotalCount, questionNumber + ANSWER_WINDOW_SIZE);

            // QuestionNumberがstartからendまでの範囲の解答を取得
            const answersWindow = processedScore.Answers.filter(a => a.QuestionNumber >= start && a.QuestionNumber <= end);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    totalQuestions: processedScore.TotalCount,
                    questionText: questionInfo.QuestionText,
                    choices: questionInfo.Choices,
                    userChoice: questionInfo.SelectedChoice,
                    groupName: groupName,
                    afterCheck: questionInfo.AfterCheck,
                    expiresAt: processedScore.ExpiresAt,
                    startedAt: processedScore.StartedAt,
                    answers: answersWindow,
                }),
            };
        }

        // If no questionNumber, return the full result
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Quiz results retrieved successfully.",
                results: { ...processedScore, GroupName: groupName },
            }),
        };
    } catch (error) {
        console.error("Error retrieving quiz results:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

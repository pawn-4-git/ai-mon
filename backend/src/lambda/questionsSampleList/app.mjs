import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

// Fisher-Yates shuffle algorithm
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const lambdaHandler = async (event) => {
    if (!QUESTIONS_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        const groupId = event.pathParameters?.groupId;
        if (!groupId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Group ID is required." }),
            };
        }

        const queryCommand = new QueryCommand({
            TableName: QUESTIONS_TABLE_NAME,
            IndexName: "GroupIdIndex",
            KeyConditionExpression: "GroupId = :groupId",
            ExpressionAttributeValues: {
                ":groupId": groupId,
            },
        });

        const response = await docClient.send(queryCommand);
        const questions = response.Items || [];

        const shuffledQuestions = shuffle(questions);
        const sampleQuestions = shuffledQuestions.slice(0, 50);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Sample questions retrieved successfully.",
                questions: sampleQuestions,
            }),
        };
    } catch (error) {
        console.error("Error retrieving sample questions:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

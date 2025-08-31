import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUESTIONS_TABLE_NAME = process.env.QUESTIONS_TABLE_NAME;

// Fisher-Yates shuffle algorithm
const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const SAMPLE_QUESTION_COUNT = 50;

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

        const allItems = [];
        let lastEvaluatedKey;

        do {
            const command = new QueryCommand({
                TableName: QUESTIONS_TABLE_NAME,
                IndexName: "GroupIdIndex",
                KeyConditionExpression: "GroupId = :groupId",
                ExpressionAttributeValues: {
                    ":groupId": groupId,
                },
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const response = await docClient.send(command);
            if (response.Items) {
                allItems.push(...response.Items);
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        const questions = allItems;

        const shuffledQuestions = shuffle(questions);
        const sampleQuestions = shuffledQuestions.slice(0, SAMPLE_QUESTION_COUNT);

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

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

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
        const scanParams = {
            TableName: QUIZ_GROUPS_TABLE_NAME,
        };

        const scanCommand = new ScanCommand(scanParams);
        const response = await docClient.send(scanCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Quiz groups retrieved successfully.",
                groups: response.Items || [],
            }),
        };
    } catch (error) {
        console.error("Error retrieving quiz groups:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

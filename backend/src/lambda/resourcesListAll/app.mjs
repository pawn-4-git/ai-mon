import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { validateSession } from "/opt/authHelper.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RESOURCES_TABLE_NAME = process.env.RESOURCES_TABLE_NAME;

export const lambdaHandler = async (event) => {
    // セッション検証（必要に応じてコメントアウトまたは調整）
    // const sessionValidation = await validateSession(event);
    // if (!sessionValidation.isValid) {
    //     return {
    //         statusCode: 401,
    //         body: JSON.stringify({ message: "Unauthorized" }),
    //     };
    // }

    if (!RESOURCES_TABLE_NAME) {
        console.error("Table name environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Table configuration is missing." }),
        };
    }

    try {
        // ScanCommand を使用してインデックス全体を取得します。
        // DynamoDB の ScanCommand では、取得するアイテム数に直接上限を設定できません。
        // そのため、全件取得後にクライアント側でソート、シャッフル、そして件数制限を行います。
        const scanCommand = new ScanCommand({
            TableName: RESOURCES_TABLE_NAME,
            IndexName: "CreatedAtIndex",
            // Limit は DynamoDB 側で適用されるのではなく、取得後にクライアント側で処理します。
        });

        const response = await docClient.send(scanCommand);

        // ランダムシャッフル関数
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        // 取得したアイテムをソート (CreatedAt の降順)
        const sortedItems = response.Items ? response.Items.sort((a, b) => {
            // CreatedAt のデータ型に合わせて比較ロジックを調整してください
            // 例: 文字列の場合 (ISO 8601形式を想定)
            const dateA = new Date(a.CreatedAt);
            const dateB = new Date(b.CreatedAt);
            return dateB.getTime() - dateA.getTime(); // 降順
        }) : [];

        // ソートされたアイテムをさらにランダムにシャッフル
        const shuffledItems = sortedItems ? shuffle([...sortedItems]) : [];

        // シャッフルされたアイテムから最初の20件を取得
        const limitedItems = shuffledItems.slice(0, 20);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Resources retrieved successfully.",
                resources: limitedItems,
            }),
        };
    } catch (error) {
        console.error("Error retrieving resources:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

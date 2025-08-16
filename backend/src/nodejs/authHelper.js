import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const secretsClient = new SecretsManagerClient({});

const SESSIONS_TABLE_NAME = process.env.SESSIONS_TABLE_NAME;

// 管理者IDをキャッシュするための変数
let cachedAdminUserId = null;

const getCookieValue = (cookieHeader, cookieName) => {
    if (!cookieHeader) return undefined;
    const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]*)`));
    return match ? match[1] : undefined;
};

/**
 * 指定されたuserIdが管理者であるかどうかを判定します。
 * 管理者IDはAWS Secrets Managerから取得し、キャッシュします。
 * @param {string} userId - チェック対象のユーザーID
 * @returns {Promise<boolean>} - 管理者の場合はtrue、それ以外はfalse
 */
export const isAdmin = async (userId) => {
    if (!userId) {
        return false;
    }

    // キャッシュがあればそれを使用
    if (cachedAdminUserId) {
        return userId === cachedAdminUserId;
    }

    const secretName = process.env.AIMON_SECRET_NAME;
    if (!secretName) {
        console.error("Error: AIMON_SECRET_NAME environment variable is not set.");
        return false;
    }
    const secretKey = "ai-mon-manager-user_id";

    const command = new GetSecretValueCommand({ SecretId: secretName });

    try {
        const data = await secretsClient.send(command);

        if (data.SecretString) {
            const secret = JSON.parse(data.SecretString);
            const adminId = secret[secretKey];

            if (!adminId) {
                console.error(`Error: Secret key "${secretKey}" not found in secret "${secretName}".`);
                return false;
            }

            // 取得したIDをキャッシュ
            cachedAdminUserId = adminId;
            console.log("cachedAdminUserId " + cachedAdminUserId);

            return userId === cachedAdminUserId;
        }
    } catch (error) {
        console.error(`Error fetching secret "${secretName}":`, error);
        // エラーが発生した場合は、安全のために管理者ではないと判断
        return false;
    }

    return false;
};


export const validateSession = async (event) => {
    if (!validateCloudFrontSecret(event.headers)) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Unauthorized: Invalid CloudFront secret." }),
        };
    }

    if (!SESSIONS_TABLE_NAME) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error: Session table configuration is missing." }),
        };
    }

    const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
    const sessionId = getCookieValue(cookieHeader, 'sessionId');
    const sessionVersionId = getCookieValue(cookieHeader, 'sessionVersionId');

    if (!sessionId || !sessionVersionId) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized: Missing session credentials." }),
        };
    }

    try {
        const command = new GetCommand({
            TableName: SESSIONS_TABLE_NAME,
            Key: { SessionId: sessionId },
        });

        const response = await docClient.send(command);

        if (!response.Item) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Invalid session." }),
            };
        }

        const session = response.Item;

        if (session.SessionVersionId !== sessionVersionId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Session version mismatch." }),
            };
        }

        const now = Math.floor(Date.now() / 1000);
        if (session.ExpiresAt <= now) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Session expired." }),
            };
        }
        return {
            isValid: true,
            userId: session.UserId,
            sessionId: session.SessionId,
            sessionVersionId: session.SessionVersionId,
            admin: session.Admin && session.adminCheckExpireAt ? session.Admin : false,
            adminCheckExpireAt: session.adminCheckExpireAt
        };

    } catch (error) {
        console.error("Error during user authentication:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error during authentication." }),
        };
    }
};

/**
 * CloudFrontからのカスタムヘッダーと��境変数の値を比較してリクエストを検証します。
 * @param {object} headers - リクエストヘッダー
 * @returns {boolean} - ヘッダーの値が環境変数の値と一致する場合はtrue、それ以外はfalse
 */
export const validateCloudFrontSecret = (headers) => {
    const secretFromHeader = headers['X-CloudFront-Secret'];
    const secretFromEnv = process.env.CLOUD_FRONT_API_SECRET_VALUE;

    if (!secretFromHeader || !secretFromEnv) {
        console.error("Secret value is missing in header or environment variable.");
        return false;
    }

    return secretFromHeader === secretFromEnv;
};
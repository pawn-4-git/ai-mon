
// backend/src/lambda/usersUpdate/index.js

import { updateUser, getUserById } from '../../nodejs/userHelper';

export const handler = async (event) => {
    const userId = event.pathParameters?.userId;
    const requestBody = JSON.parse(event.body || '{}');

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'User ID is required' }),
        };
    }

    // ユーザーが存在するか確認 (オプションですが、より堅牢なエラーハンドリングのために推奨)
    const existingUser = await getUserById(userId);
    if (!existingUser) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'User not found' }),
        };
    }

    // 更新対象のフィールドをフィルタリング (例: userName, email など)
    // ここでは、requestBody の全てのフィールドを更新対象としますが、
    // 必要に応じて特定のフィールドのみを許可するように変更してください。
    const updates = {};
    if (requestBody.userName) updates.userName = requestBody.userName;
    if (requestBody.email) updates.email = requestBody.email;
    // 他の更新可能なフィールドがあればここに追加

    if (Object.keys(updates).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'No updatable fields provided' }),
        };
    }

    try {
        const updatedUser = await updateUser(userId, updates);

        return {
            statusCode: 200,
            body: JSON.stringify(updatedUser),
        };
    } catch (error) {
        console.error('Error updating user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

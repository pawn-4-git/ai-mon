// 環境変数からAPIのベースURLを取得します。
// NEXT_PUBLIC_API_BASE_URL が設定されていない場合は、デフォルトのURLを使用します。
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

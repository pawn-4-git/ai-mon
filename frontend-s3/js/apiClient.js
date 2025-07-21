import { QuizGroup, Question, Quiz, ScoreRecord, ReferenceBook } from '@/types';

import { API_BASE_URL as DEFAULT_API_BASE_URL } from './api_domain.ts';

// 環境変数からAPIのベースURLを取得します。
// NEXT_PUBLIC_API_BASE_URL が設定されていない場合は、デフォルトのURLを使用します。


/**
 * APIリクエストを行うための汎用関数
 * @param endpoint - APIのエンドポイントパス (例: '/users', '/quizzes')
 * @param options - fetch APIに渡すオプション (method, headers, bodyなど)
 * @param base_url - (オプション) APIのベースURL
 * @returns Promise<any> - APIからのレスポンスデータ
 */
export async function apiClient(endpoint, options, base_url = DEFAULT_API_BASE_URL) {
  const url = `${base_url}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // 必要に応じて認証トークンなどをここに追加します
    // 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
  };

  const fetchOptions = {
    method: options?.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // エラーレスポンスの場合
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API request failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    // レスポンスが空でない場合のみJSONをパース
    if (response.status === 204) { // No Content
        return {}; // または null など、適切な型を返す
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`API Client Error for ${url}:`, error);
    // エラーを再スローするか、デフォルト値を返すなどの処理
    throw error;
  }
}

// よく使うメソッド用のヘルパー関数 (オプション)
export const get = (endpoint, options, base_url) =>
  apiClient(endpoint, { ...options, method: 'GET' }, base_url);

export const post = (endpoint, body, options, base_url) =>
  apiClient(endpoint, { ...options, method: 'POST', body }, base_url);

export const put = (endpoint, body, options, base_url) =>
  apiClient(endpoint, { ...options, method: 'PUT', body }, base_url);

export const del = (endpoint, options, base_url) =>
  apiClient(endpoint, { ...options, method: 'DELETE' }, base_url);

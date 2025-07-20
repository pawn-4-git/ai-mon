import { QuizGroup, Question, Quiz, ScoreRecord, ReferenceBook } from '@/types';

// 環境変数からAPIのベースURLを取得します。
// NEXT_PUBLIC_API_BASE_URL が設定されていない場合は、デフォルトのURLを使用します。
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'; // デフォルトはローカル開発用

interface ApiClientOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * APIリクエストを行うための汎用関数
 * @param endpoint - APIのエンドポイントパス (例: '/users', '/quizzes')
 * @param options - fetch APIに渡すオプション (method, headers, bodyなど)
 * @returns Promise<any> - APIからのレスポンスデータ
 */
export async function apiClient<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // 必要に応じて認証トークンなどをここに追加します
    // 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
  };

  const fetchOptions: RequestInit = {
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
        return {} as T; // または null など、適切な型を返す
    }

    const data: T = await response.json();
    return data;

  } catch (error) {
    console.error(`API Client Error for ${url}:`, error);
    // エラーを再スローするか、デ���ォルト値を返すなどの処理
    throw error;
  }
}

// よく使うメソッド用のヘルパー関数 (オプション)
export const get = <T>(endpoint: string, options?: Omit<ApiClientOptions, 'method'>) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

export const post = <T>(endpoint: string, body: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
  apiClient<T>(endpoint, { ...options, method: 'POST', body });

export const put = <T>(endpoint: string, body: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
  apiClient<T>(endpoint, { ...options, method: 'PUT', body });

export const del = <T>(endpoint: string, options?: Omit<ApiClientOptions, 'method'>) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

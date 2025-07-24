(function() {
  'use strict';

  /**
   * リクエストを行うための汎用関数
   * @param {string} endpoint - APIのエンドポイントパス (例: '/users', '/quizzes')
   * @param {object} options - fetch APIに渡すオプション (method, headers, bodyなど)
   * @returns {Promise<any>} - APIからのレスポンスデータ
   */
  async function apiClient(endpoint, options) {
    const url = endpoint;

    const defaultHeaders = {
      'Content-Type': 'application/json',
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
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API request failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      if (response.status === 204) { // No Content
        return {};
      }

      return await response.json();

    } catch (error) {
      console.error(`API Client Error for ${url}:`, error);
      throw error;
    }
  }

  // ヘルパー関数
  const get = (endpoint, options) =>
    apiClient(endpoint, { ...options, method: 'GET' });

  const post = (endpoint, body, options) =>
    apiClient(endpoint, { ...options, method: 'POST', body });

  const put = (endpoint, body, options) =>
    apiClient(endpoint, { ...options, method: 'PUT', body });

  const del = (endpoint, options) =>
    apiClient(endpoint, { ...options, method: 'DELETE' });

  // windowオブジェクトにapiClientを公開
  window.apiClient = {
    get,
    post,
    put,
    del,
    request: apiClient, // メイン関数も公開
  };

})();

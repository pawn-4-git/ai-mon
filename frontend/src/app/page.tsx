'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; // Scriptコンポーネントをインポート

// apiClientをwindowオブジェクトのプロパティとして型定義
declare global {
  interface Window {
    apiClient?: {
      request: (endpoint: string, options?: RequestInit) => Promise<unknown>;
      get: (endpoint: string, options?: RequestInit) => Promise<unknown>;
      post: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
      put: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
      del: (endpoint: string, options?: RequestInit) => Promise<unknown>;
    };
  }
}

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/quiz-list');
  };

  // handleAnonymousCreation 関数をコンポーネント内���移動し、API呼び出しを追加
  const handleAnonymousCreation = async () => {
    try {
      if (!window.apiClient) {
        // ユーザーに機能がまだ利用できないことを通知
        alert('機能の準備中です。少し待ってからもう一度お試しください。');
        throw new Error('apiClient is not available');
      }

      const endpoint = '/Prod/users/register';
      // レスポンスの型を明示的に定義
      interface ApiResponse {
        message: string;
        UserId: string;
        SessionId: string;
        SessionVersionId: string;
        AccountName: string;
      }

      // apiClient.post の呼び出しから型引数を削除し、戻り値に型アサーションを使用
      const response = await window.apiClient.post(
        endpoint,
        { anonymous: true }
      ) as ApiResponse;

      // response が ApiResponse 型であることを確認してからプロパティにアクセス
      const { AccountName, SessionId, SessionVersionId } = response;

      console.log('Anonymous user created successfully:', response);
      alert('匿名アカウントが作成されました！');

      // --- クッキーに保存する処理を追加 ---
      document.cookie = `username=${AccountName}; path=/; max-age=86400`;
      document.cookie = `sessionId=${SessionId}; path=/; max-age=86400`;
      document.cookie = `sessionVersionId=${SessionVersionId}; path=/; max-age=86400`;
      // --- クッキー保存処理ここまで ---

      router.push('/quiz-list');

    } catch (error) {
      console.error('Failed to create anonymous user:', error);
      // ユーザーにエラーを通知するが、apiClientがない場��のアラートと重複しないように
      if (String(error).includes('apiClient is not available') || String(error).includes('not defined')) {
        // すでにアラートが表示されているので何もしない
      } else {
        alert('匿名アカウントの作成に失敗しました。');
      }
    }
  };

  return (
    <>
      <Script
        src={`/contents/js/apiClient.js`}
        strategy="beforeInteractive"
      />
      <div className="login-page">
        <div className="container">
          <div className="header">
            <h1>あいもん</h1>
          </div>

          {/* Login Form */}
          <div id="login-form" style={{ display: isLoginView ? 'block' : 'none' }}>
            <h2>ログイン</h2>
            <div className="form-group">
              <label htmlFor="login-username">アカウント名:</label>
              <input type="text" id="login-username" placeholder="8桁以上の英数字" />
            </div>
            <button onClick={handleNavigation}>ログイン</button>
            <p className="toggle-link" onClick={() => setIsLoginView(false)}>
              アカウントをお持ちでない方はこちら
            </p>
          </div>

          {/* Register Form */}
          <div id="register-form" style={{ display: isLoginView ? 'none' : 'block' }}>
            <h2>ユーザー登録</h2>
            <div className="form-group">
              <label htmlFor="register-username">アカウント名:</label>
              <input type="text" id="register-username" placeholder="8桁以上の英数字" />
            </div>
            <button onClick={handleNavigation}>登録</button>
            {/* 匿名アカウント作成ボタン */}
            <button onClick={handleAnonymousCreation}>
              匿名でアカウント作成
            </button>
            <p className="toggle-link" onClick={() => setIsLoginView(true)}>
              すでにアカウントをお持ちの方はこちら
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

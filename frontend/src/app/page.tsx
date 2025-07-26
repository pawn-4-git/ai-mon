'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

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

  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  const handleLogin = async () => {
    if (!window.apiClient) {
      alert('API���ライアントが利用できません。ページを再読み込みしてください。');
      return;
    }

    const accountName = loginUsernameRef.current?.value.trim();

    if (!accountName) {
      alert('アカウント名を入力してください。');
      return;
    }

    try {
      // リクエストボディをJSON形式に変更
      const requestBody = { accountName: accountName };
      const response = await window.apiClient.post('/Prod/users/login', requestBody);
      const loginResult = response as { message: string; UserId: string; SessionId: string };

      if (loginResult && loginResult.message === 'Login successful.') {
        alert('ログインに成功しました！');
        router.push('/quiz-list');
      } else {
        alert(loginResult?.message || 'ログインに失敗しました。');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('ログイン中にエラーが発生しました。');
    }
  };

  const handleNavigation = () => {
    router.push('/quiz-list');
  };

  const handleAnonymousCreation = async () => {
    try {
      if (!window.apiClient) {
        alert('機能の準備中です。少し待ってからもう一度お試しください。');
        throw new Error('apiClient is not available');
      }

      const endpoint = '/Prod/users/register';
      await window.apiClient.post(
        endpoint,
        { anonymous: true }
      );

      alert('匿名アカウントが作成されました！');
      router.push('/quiz-list');

    } catch (error) {
      console.error('Failed to create anonymous user:', error);
      if (String(error).includes('apiClient is not available') || String(error).includes('not defined')) {
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

          <div id="login-form" style={{ display: isLoginView ? 'block' : 'none' }}>
            <h2>ログイン</h2>
            <div className="form-group">
              <label htmlFor="login-username">アカウント名:</label>
              <input type="text" id="login-username" placeholder="8桁以上の英数字" ref={loginUsernameRef} />
            </div>
            <button onClick={handleLogin}>ログイン</button>
            <p className="toggle-link" onClick={() => setIsLoginView(false)}>
              アカウントをお持ちでない方はこちら
            </p>
          </div>

          <div id="register-form" style={{ display: isLoginView ? 'none' : 'block' }}>
            <h2>ユーザー登録</h2>
            <div className="form-group">
              <label htmlFor="register-username">アカウント名:</label>
              <input type="text" id="register-username" placeholder="8桁以上の英数字" ref={registerUsernameRef} />
            </div>
            <button onClick={handleNavigation}>登録</button>
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

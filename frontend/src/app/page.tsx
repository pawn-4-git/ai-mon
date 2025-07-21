'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; // Scriptコンポーネントをインポート

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/quiz-list');
  };

  // handleAnonymousCreation 関数をコンポーネント内に移動し、API呼び出しを追加
  const handleAnonymousCreation = async () => {
    try {
      // apiClient.jsによってグローバルスコープにapiClientが定義されていると仮定
      if (!(window as any).apiClient) {
        throw new Error('apiClient is not available');
      }
      // /users/register エンドポイントにPOSTリクエストを送信
      const response = await (window as any).apiClient.post(
        '/users/register',
        { anonymous: true },
        process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
        {} // options
      );

      // 成功した場合の処理
      console.log('Anonymous user created successfully:', response);
      // 必要に応じて、作成されたユーザー情報でstateを更新したり、
      // 別のページにリダイレクトしたりします。
      // 例: router.push('/dashboard');
      alert('匿名アカウントが作成されました！');
      router.push('/quiz-list'); // 匿名作成後にクイズリストへ遷移させる例

    } catch (error) {
      // エラーハンドリング
      console.error('Failed to create anonymous user:', error);
      alert('匿名アカウントの作成に失敗しました。');
    }
  };

  return (
    <>
      <Script
        src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/contents/js/apiClient.js`}
        strategy="beforeInteractive"
        onLoad={() => setIsScriptLoaded(true)}
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
              <label htmlFor="register-username">���カウント名:</label>
              <input type="text" id="register-username" placeholder="8桁以上の英数字" />
            </div>
            <button onClick={handleNavigation}>登録</button>
            {/* 匿名アカウント作成ボタンを追加 */}
            <button onClick={handleAnonymousCreation} disabled={!isScriptLoaded}>
              {isScriptLoaded ? '匿名でアカウント作成' : '準備中...'}
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
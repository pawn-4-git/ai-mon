'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, post } from '@/lib/apiClient'; // apiClientとpost関数をインポート

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/quiz-list');
  };

  // handleAnonymousCreation 関数をコンポーネント内に移動し、API呼び出しを追加
  const handleAnonymousCreation = async () => {
    try {
      // /users/register エンドポイントにPOSTリクエストを送信
      // ���名作成なので、リクエストボディは空、または { anonymous: true } など
      const response = await post('/users/register', { anonymous: true }); // または {}

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
          {/* 匿名アカウント作成ボタンを追加 */}
          <button onClick={handleAnonymousCreation}>匿名でアカウント作成</button>
          <p className="toggle-link" onClick={() => setIsLoginView(true)}>
            すでにアカウントをお持ちの方はこちら
          </p>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext'; // useAuth をインポート

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

// お知らせの型定義
interface Announcement {
  id: number;
  title: string;
  date: string;
}

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();
  const auth = useAuth(); // AuthContext を使用

  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  // 固定のお知らせデータ
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // ここでAPIから取得するか、固定データをセットする
    const mockAnnouncements: Announcement[] = [
      { id: 1, title: 'システムメンテナンスのお知らせ', date: '2025-08-15' },
      { id: 2, title: '新しいクイズグループ「歴史編」を追加しました！', date: '2025-08-10' },
      { id: 3, title: '利用規約を更新しました。', date: '2025-08-01' },
    ];
    setAnnouncements(mockAnnouncements);
  }, []);


  const handleLogin = async () => {
    if (!window.apiClient) {
      alert('APIクライアントが利用できません。ページを再読み込みしてください。');
      return;
    }

    const accountName = loginUsernameRef.current?.value.trim();

    if (!accountName) {
      alert('アカウント名を入力してください。');
      return;
    }

    try {
      const requestBody = { accountName: accountName };
      // 型アサーションから .data を削除
      const response = await window.apiClient.post('/Prod/users/login', requestBody) as { AccountName: string, message: string };

      if (response && response.AccountName) {
        auth.login(response.AccountName); // AuthContext の状態を更新
        alert('ログインに成功しました！');
        router.push('/quiz-list');
      } else {
        alert(response?.message || 'ログインに失敗しました。');
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
      // 型アサーションから .data を削除
      const response = await window.apiClient.post(
        endpoint,
        { anonymous: true }
      ) as { AccountName: string };

      if (response && response.AccountName) {
        auth.login(response.AccountName); // AuthContext の状態を更新
        alert('匿名アカウントが作成されました！');
        router.push('/quiz-list');
      } else {
        alert('匿名アカウントの作成に失敗しました。');
      }

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

          {/* お知らせセクション */}
          <div className="announcements-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>お知らせ</h2>
            {announcements.length > 0 ? (
              <ul>
                {announcements.map(ann => (
                  <li key={ann.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    <strong>{ann.date}:</strong> {ann.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>現在、新しいお知らせはありません。</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


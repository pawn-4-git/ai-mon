'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import Announcements from '@/components/Announcements';
import { appTitle } from '@/config';
import Image from 'next/image';


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

// APIレスポンスの型定義
interface Resource {
  ResourceId: string;
  GroupId: string;
  URL: string;
  Title: string;
  ImgSrc: string;
  CreatedAt: string;
}

interface ResourceGroup {
  GroupName: string;
  resources: Resource[];
}

interface ResourcesByGroup {
  [groupId: string]: ResourceGroup;
}

interface ResourcesApiResponse {
  resourcesByGroup: ResourcesByGroup;
}

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();
  const auth = useAuth();

  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  const [resourcesByGroup, setResourcesByGroup] = useState<ResourcesByGroup>({});
  const [loadingResources, setLoadingResources] = useState<boolean>(true);

  useEffect(() => {
    const fetchResources = async () => {
      if (!window.apiClient) {
        setTimeout(fetchResources, 100);
        return;
      }
      try {
        setLoadingResources(true);
        const data = await window.apiClient.get('/Prod/resources/all') as ResourcesApiResponse;
        if (data && data.resourcesByGroup) {
          setResourcesByGroup(data.resourcesByGroup);
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setLoadingResources(false);
      }
    };

    const fetchLogout = async () => {
      const sessionId = Cookies.get('sessionId');
      if (sessionId) {
        if (!window.apiClient) {
          setTimeout(fetchLogout, 100);
          return;
        }
        try {
          await window.apiClient.post('/Prod/users/logout', undefined);
        } catch (error) {
          console.error('Failed to logout:', error);
        }
      }
    };

    fetchResources();
    fetchLogout();
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
      const response = await window.apiClient.post('/Prod/users/login', requestBody) as { AccountName: string, message: string };

      if (response && response.AccountName) {
        auth.login(response.AccountName);
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

  const handleAnonymousCreation = async (anonymous = true) => {
    try {
      if (!window.apiClient) {
        alert('機能の準備中です。少し待ってからもう一度お試しください。');
        throw new Error('apiClient is not available');
      }

      const endpoint = '/Prod/users/register';
      const accountName = registerUsernameRef.current?.value.trim();

      if (!anonymous && !accountName) {
        alert('アカウント名を入力してください。');
        return;
      }

      const requestBody = anonymous ? { anonymous: true } : { AccountName: accountName, anonymous: false };

      const response = await window.apiClient.post(
        endpoint,
        requestBody
      ) as { AccountName: string, message?: string };

      if (response && response.AccountName) {
        auth.login(response.AccountName);
        alert(anonymous ? '匿名アカウントが作成されました！' : 'アカウントが登録されました！');
        router.push('/quiz-list');
      } else {
        alert(response?.message || (anonymous ? '匿名アカウントの作成に失敗しました。' : 'アカウントの登録に失敗しました。'));
      }

    } catch (error) {
      console.error('Failed to create user:', error);
      alert('処理中にエラーが発生しました。');
    }
  };

  return (
    <>
      <Script
        src={`/contents/js/apiClient.js`}
        strategy="beforeInteractive"
      />
      <div className="login-page">
        <div className="container mx-auto">
          <div className="header">
            <h1>{appTitle}</h1>
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
            <button onClick={() => handleAnonymousCreation(false)}>登録</button>
            <button onClick={() => handleAnonymousCreation(true)}>
              匿名でアカウント作成
            </button>
            <p className="toggle-link" onClick={() => setIsLoginView(true)}>
              すでにアカウントをお持ちの方はこちら
            </p>
          </div>

          <Announcements />

          {/* 学習リソースセクション */}
          <div className="learning-resources">
            <h2>参考書など</h2>
            {loadingResources ? (
              <p>Loading resources...</p>
            ) : (
              Object.entries(resourcesByGroup).map(([groupId, groupData]) => (
                <div key={groupId} className="resource-group">
                  <h3>{groupData.GroupName}</h3>
                  <ul className="reference-books-list">
                    {groupData.resources.map((resource) => (
                      <li key={resource.ResourceId}>
                        <a href={resource.URL} target="_blank" rel="noopener noreferrer">
                          {resource.ImgSrc && (
                            <Image src={resource.ImgSrc} alt={resource.Title} width={150} height={200} style={{ objectFit: 'contain' }} />
                          )}
                          <span>{resource.Title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}


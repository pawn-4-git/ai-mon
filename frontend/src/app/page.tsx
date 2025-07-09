'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/quiz-list');
  };

  return (
    <div className="login-page">
      <div className="container">
        <Header />
        
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
          <p className="toggle-link" onClick={() => setIsLoginView(true)}>
            すでにアカウントをお持ちの方はこちら
          </p>
        </div>
      </div>
    </div>
  );
}
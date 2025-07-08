'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      if (formData.username && formData.password) {
        router.push('/quiz-list');
      } else {
        alert('ユーザー名とパスワードを入力してください。');
      }
    } else {
      if (formData.username && formData.email && formData.password) {
        router.push('/quiz-list');
      } else {
        alert('すべての項目を入力してください。');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">AI-Mon Quiz</h1>
          <p className="text-gray-600">クイズアプリケーション</p>
        </div>

        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
              isLogin 
                ? 'border-blue-600 text-blue-600 font-medium' 
                : 'border-gray-300 text-gray-500'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
              !isLogin 
                ? 'border-blue-600 text-blue-600 font-medium' 
                : 'border-gray-300 text-gray-500'
            }`}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="username">ユーザー名:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="ユーザー名を入力"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">メールアドレス:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="メールアドレスを入力"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">パスワード:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="パスワードを入力"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isLogin ? 'ログイン' : '新規登録'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline ml-1"
            >
              {isLogin ? '新規登録' : 'ログイン'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  username?: string;
  showNavigation?: boolean;
}

export default function Header({ username = "ユーザー", showNavigation = true }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/quiz-list" className="text-xl font-bold text-blue-600">
              AI-Mon Quiz
            </Link>
            {showNavigation && (
              <nav className="flex space-x-4">
                <Link href="/quiz-list" className="text-gray-600 hover:text-blue-600">
                  クイズ一覧
                </Link>
                <Link href="/create-quiz" className="text-gray-600 hover:text-blue-600">
                  クイズ作成
                </Link>
                <Link href="/score-history" className="text-gray-600 hover:text-blue-600">
                  成績履歴
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">ようこそ、{username}さん</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

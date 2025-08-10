'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { appTitle } from '@/config'; // appTitle をインポート

export default function Header() {
  const { logout, accountName, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  // const appTitle = process.env.NEXT_PUBLIC_APP_TITLE;
  return (
    <div className="header">
      <h1>{appTitle}</h1>
      {isAuthenticated && (
        <div className="user-info">
          <Link href="/score-history">
            ようこそ、{accountName ? `${accountName}さん` : 'ゲストさん'}！
          </Link>
          <button onClick={handleLogout} className="logout-button">ログアウト</button>
        </div>
      )}
    </div>
  );
}
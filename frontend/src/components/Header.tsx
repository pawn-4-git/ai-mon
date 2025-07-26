'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { logout, accountName, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="header">
      <h1>あいもん</h1>
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

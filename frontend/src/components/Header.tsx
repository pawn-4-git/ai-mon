'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
// js-cookie のインポートを削除

export default function Header() {
  const { logout } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {

    const storedUsername = 'username'; // 'username' という名前のクッキーを取得
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = async () => {
    // ログアウト時に username クッキーを削除する処理を追加
    // document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await logout();
    router.push('/');
  };

  return (
    <div className="header">
      <h1>あいもん</h1>
      <div className="user-info">
        <Link href="/score-history">
          ようこそ、{username ? `${username}さん` : 'ゲストさん'}！
        </Link>
        <button onClick={handleLogout} className="logout-button">ログアウト</button>
      </div>
    </div>
  );
}
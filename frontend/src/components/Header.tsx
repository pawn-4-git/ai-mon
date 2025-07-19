'use client';

import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <div className="header">
      <h1>あいもん</h1>
      <div className="user-info">
        <Link href="/score-history">ようこそ、ユーザー名さん！</Link>
        <Link href="/">ログアウト</Link>
      </div>
    </div>
  );
}
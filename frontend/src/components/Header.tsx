'use client';

import React from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { logout, accountName, isAuthenticated } = useAuth();
  const router = useRouter();
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* Google Analytics */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            `}
          </Script>
        </>
      )}

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
    </>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import React from 'react';

// AuthProviderを適用しないパスのリスト
const publicPaths = ['/'];

export default function ConditionalAuthProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  // 現在のパスがpublicPathsに含まれるかチェック
  const isPublicPage = publicPaths.includes(pathname);

  // publicなページの場合はAuthProviderを適用せず、
  // それ以外のページではAuthProviderでラップする
  return isPublicPage ? (
    <main className={className}>{children}</main>
  ) : (
    <AuthProvider className={className}>{children}</AuthProvider>
  );
}

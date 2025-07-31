'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  accountName: string | null;
  login: (accountName: string) => void; // API call is removed, just updates state
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  // For restoring session on page load
  const fetchAccountName = useCallback(async () => {
    if (accountName && user?.id) {
      return;
    }
    if (!window.apiClient) return;
    try {
      // 型アサーションから .data を削除
      const response = await window.apiClient.get('/Prod/users/get') as { AccountName: string, UserId: string };
      if (response && response.AccountName && response.UserId) {
        setAccountName(response.AccountName);
        // setUser state might be stale here, so we check against the response
        if (!user || user.username !== response.AccountName || user.id !== response.UserId) {
          setUser({ id: response.UserId, username: response.AccountName, email: '' });
        }
      }
    } catch (error) {
      // This can fail if the user is not logged in, which is fine.
      console.error('Session restore failed:', error);
      setAccountName(null);
      setUser(null);
    }
  }, [user, accountName]);

  useEffect(() => {
    fetchAccountName();
  }, [fetchAccountName]);

  const login = (newAccountName: string) => {
    setAccountName(newAccountName);
    // After login, we don't have the userId immediately.
    // The useEffect will trigger fetchAccountName which will fetch the user info.
    // We can set a temporary user state, or null. Let's set it to null.
    setUser(null);
    fetchAccountName();
  };

  const logout = async () => {
    if (!window.apiClient) return;
    try {
      await window.apiClient.post('/Prod/users/logout', undefined);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear client-side state on logout
      setUser(null);
      setAccountName(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accountName,
      login,
      logout,
      isAuthenticated: !!accountName
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _password = password;
    const mockUser: User = {
      id: '1',
      username,
      email: `${username}@example.com`
    };
    setUser(mockUser);
    return true;
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _password = password;
    const mockUser: User = {
      id: '1',
      username,
      email
    };
    setUser(mockUser);
    return true;
  };

  const logout = async () => {
    if (!window.apiClient) {
      console.error('apiClient is not available on window object.');
      // フォールバックとして、またはエラーとして処理
      return;
    }
    try {
      await window.apiClient.post('/Prod/users/logout', undefined);

      // サーバーでのログアウトが成功したら、クライアントの状態を更新します
      setUser(null);

    } catch (error) {
      console.error('Logout error:', error);
      // ここでUIにエラーメッセージを表示するなどの処理を追加することもできます
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user
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

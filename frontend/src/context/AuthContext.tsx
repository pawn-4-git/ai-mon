'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  accountName: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  const fetchAccountName = async () => {
    if (!window.apiClient) {
      console.error('apiClient is not available on window object.');
      return;
    }
    try {
      const response = await window.apiClient.get('/Prod/users/get') as { data: { AccountName: string } };
      if (response.data && response.data.AccountName) {
        setAccountName(response.data.AccountName);
        // Also set a minimal user object if not already set
        if (!user) {
          setUser({ id: '1', username: response.data.AccountName, email: '' });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setAccountName(null);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchAccountName();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // This is a mock login. In a real app, you'd call a login API.
    // After successful login from the API, you would get a session token.
    // Here we just optimistically fetch the account name.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _password = password;
    await fetchAccountName();
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
      return;
    }
    try {
      await window.apiClient.post('/Prod/users/logout', undefined);
      setUser(null);
      setAccountName(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accountName,
      login,
      register,
      logout,
      isAuthenticated: !!accountName // Base authentication on having an accountName
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

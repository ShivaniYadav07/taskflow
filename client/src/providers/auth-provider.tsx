'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, AuthContextType } from '@/types';
import { authService } from '@/services/auth.service';

const AuthContext = createContext<AuthContextType | null>(null);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // StrictMode fires effects twice in dev — guard against double init
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoading(false);
      return;
    }

    // Surface cached user immediately so the UI renders without a spinner
    const cached = readStoredUser();
    if (cached) {
      setUser(cached);
      setIsLoading(false);

      // Silently revalidate token in the background; update or evict on failure
      authService
        .getMe()
        .then(({ data }) => {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        })
        .catch(() => {
          qc.clear();
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'auth=; path=/; max-age=0';
        });

      return;
    }

    // Token exists but no cached user — block until /me resolves
    authService
      .getMe()
      .then(({ data }) => {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      })
      .catch(() => {
        qc.clear();
        localStorage.removeItem('token');
        document.cookie = 'auth=; path=/; max-age=0';
      })
      .finally(() => setIsLoading(false));
  }, [qc]);

  const login = useCallback(
    (token: string, userData: User) => {
      // Wipe any previous user's cached queries before switching sessions
      qc.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `auth=1; path=/; max-age=604800; SameSite=Lax`;
      setUser(userData);
    },
    [qc],
  );

  const logout = useCallback(() => {
    qc.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'auth=; path=/; max-age=0';
    setUser(null);
  }, [qc]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

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
    if (initialized.current) return;
    initialized.current = true;

    const cached = readStoredUser();

    if (cached) {
      // Show cached user immediately — no spinner. Then silently revalidate via /me.
      // The httpOnly cookie is sent automatically (same-origin via Next.js proxy).
      setUser(cached);
      setIsLoading(false);

      authService
        .getMe()
        .then(({ data }) => {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        })
        .catch(() => {
          // Cookie is invalid or expired — clear local state
          qc.clear();
          setUser(null);
          localStorage.removeItem('user');
        });

      return;
    }

    // No cached user — attempt to restore session from the cookie
    authService
      .getMe()
      .then(({ data }) => {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      })
      .catch(() => {
        // No valid session — stay logged out
      })
      .finally(() => setIsLoading(false));
  }, [qc]);

  // Token is managed entirely by the server via httpOnly cookie.
  // login() only needs the user object returned by the API response body.
  const login = useCallback(
    (userData: User) => {
      qc.clear();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    },
    [qc],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Server may already be unreachable — proceed with local cleanup
    }
    qc.clear();
    localStorage.removeItem('user');
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

import { useState, useEffect, useCallback } from 'react';
import { auth, setToken, removeToken, getToken } from '../lib/api';
import type { AuthResponse } from '../types';

const AUTH_DATA_KEY = 'auth_data';

interface AuthData {
  role: 'ADMIN' | 'TEACHER';
  teacherId?: number;
  teacherName?: string;
  username?: string;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function authDataFromResponse(res: AuthResponse): AuthData {
  return {
    role: res.role,
    teacherId: res.teacher_id,
    teacherName: res.teacher_full_name,
  };
}

export function useAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem(AUTH_DATA_KEY);
    if (token && stored) {
      try {
        const payload = parseJwtPayload(token);
        const exp = payload?.exp as number | undefined;
        if (exp && Date.now() / 1000 > exp) {
          removeToken();
          localStorage.removeItem(AUTH_DATA_KEY);
        } else {
          setAuthData(JSON.parse(stored));
        }
      } catch {
        removeToken();
        localStorage.removeItem(AUTH_DATA_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await auth.login(username, password);
      setToken(res.access_token);
      const data = authDataFromResponse(res);
      localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(data));
      setAuthData(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    localStorage.removeItem(AUTH_DATA_KEY);
    setAuthData(null);
  }, []);

  return {
    isAuthenticated: authData !== null,
    isLoading,
    isAdmin: authData?.role === 'ADMIN',
    isTeacher: authData?.role === 'TEACHER',
    teacherId: authData?.teacherId ?? null,
    teacherName: authData?.teacherName ?? null,
    role: authData?.role ?? null,
    login,
    logout,
  };
}

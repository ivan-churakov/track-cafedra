import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'admin_authenticated';
const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'mirea2024';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    setIsAuthenticated(stored === 'true');
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, login, logout };
}

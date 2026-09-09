import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiSignup, apiLogout } from '@/lib/api.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'mallhub_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedIn = await apiLogin(email, password);
    setUser(loggedIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    return loggedIn;
  }, []);

  const signup = useCallback(async (data) => {
    const newUser = await apiSignup(data);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

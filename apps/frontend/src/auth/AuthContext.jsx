import React, { createContext, useContext, useMemo, useState } from 'react';
import { createApiClient } from '../api/client.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'cylendra_auth';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const stored = typeof window !== 'undefined' ? readStored() : { token: null, user: null };
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);

  const api = useMemo(
    () =>
      createApiClient({
        getToken: () => token,
      }),
    [token]
  );

  function persist(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  }

  async function register(payload) {
    const { data } = await api.post('/api/auth/register', payload);
    persist(data.token, data.user);
    return data;
  }

  async function login(payload) {
    const { data } = await api.post('/api/auth/login', payload);

    const expectedRole = payload?.expectedRole;
    if (expectedRole && data?.user?.role && data.user.role !== expectedRole) {
      throw new Error(`Role mismatch. Selected: ${expectedRole}, Account: ${data.user.role}`);
    }

    persist(data.token, data.user);
    return data;
  }

  function logout() {
    persist(null, null);
  }

  const value = {
    api,
    token,
    user,
    isAuthed: Boolean(token),
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

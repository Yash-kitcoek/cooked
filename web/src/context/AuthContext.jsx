import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const AuthContext = createContext(null);

function formatApiError(data, status) {
  if (Array.isArray(data?.detail)) {
    return data.detail.map((d) => {
      const loc = Array.isArray(d?.loc) ? `${d.loc.join('.')}: ` : '';
      return `${loc}${d?.msg || 'Invalid request'}`;
    }).join(', ');
  }
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (data?.detail && typeof data.detail === 'object') return JSON.stringify(data.detail);
  return `Request failed${status ? ` (${status})` : ''}`;
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || '');
  const [session, setSessionState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('session') || 'null'); } catch { return null; }
  });
  const [message, setMessage] = useState('');

  const setToken = useCallback((value) => {
    const next = value || '';
    setTokenState(next);
    if (next) localStorage.setItem('token', next);
    else localStorage.removeItem('token');
  }, []);

  const setSession = useCallback((value) => {
    setSessionState(value || null);
    if (value) localStorage.setItem('session', JSON.stringify(value));
    else localStorage.removeItem('session');
  }, []);

  const logout = useCallback((showMessage = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    setTokenState('');
    setSessionState(null);
    if (showMessage) setMessage('You are logged out.');
  }, []);

  const api = useCallback(async (path, options = {}) => {
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    let response;
    try {
      response = await fetch(`${API}${path}`, { ...options, headers });
    } catch (error) {
      throw new Error('Unable to reach the API server. Check that FastAPI is running and VITE_API_BASE_URL is correct.');
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => '');

    if (!response.ok) {
      if (response.status === 401) logout(false);
      const errorData = typeof data === 'string' ? { detail: data } : data;
      throw new Error(formatApiError(errorData, response.status));
    }
    return data;
  }, [token, logout]);

  const value = useMemo(() => ({
    token, setToken, session, setSession, message, setMessage, api, logout, apiBaseUrl: API,
  }), [token, setToken, session, setSession, message, api, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

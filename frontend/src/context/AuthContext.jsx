import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  loginWithProvider: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

const safeGetToken = () => {
  if (typeof api?.getAuthToken === 'function') {
    return api.getAuthToken();
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const safeSetToken = (token) => {
  if (typeof api?.setAuthToken === 'function') {
    api.setAuthToken(token);
  } else if (typeof window !== 'undefined' && window.localStorage) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => safeGetToken());
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (typeof api?.getMe !== 'function') {
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      setUser(null);
      setToken(null);
      safeSetToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      let urlToken = null;

      if (hash && hash.includes('token=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        urlToken = params.get('token');
      } else if (window.location.search && window.location.search.includes('token=')) {
        const params = new URLSearchParams(window.location.search);
        urlToken = params.get('token');
      }

      if (urlToken) {
        safeSetToken(urlToken);
        setToken(urlToken);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const currentToken = safeGetToken();
    if (currentToken) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const loginWithProvider = (provider) => {
    if (typeof api?.getOAuthLoginUrl === 'function') {
      const url = api.getOAuthLoginUrl(provider);
      window.location.href = url;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (typeof api?.logout === 'function') {
        await api.logout();
      }
    } finally {
      setUser(null);
      setToken(null);
      safeSetToken(null);
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    loginWithProvider,
    logout,
    refreshUser: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

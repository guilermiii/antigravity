import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  clearAuthError: () => {},
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
  const [authError, setAuthError] = useState(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

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
    let urlToken = null;

    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      let detectedError = null;

      // 1. Captura de erro retornado no hash (#auth_error= ou #error=)
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        if (hashParams.has('auth_error')) {
          detectedError = hashParams.get('auth_error');
        } else if (hashParams.has('error_description')) {
          detectedError = hashParams.get('error_description');
        } else if (hashParams.has('error')) {
          detectedError = hashParams.get('error');
        }

        if (hashParams.has('token')) {
          urlToken = hashParams.get('token');
        }
      }

      // 2. Captura de erro retornado na query string (?auth_error= ou ?error=)
      if (!detectedError && search) {
        const searchParams = new URLSearchParams(search);
        if (searchParams.has('auth_error')) {
          detectedError = searchParams.get('auth_error');
        } else if (searchParams.has('error_description')) {
          detectedError = searchParams.get('error_description');
        } else if (searchParams.has('error')) {
          detectedError = searchParams.get('error');
        }

        if (!urlToken && searchParams.has('token')) {
          urlToken = searchParams.get('token');
        }
      }

      if (detectedError) {
        try {
          setAuthError(decodeURIComponent(detectedError));
        } catch {
          setAuthError(detectedError);
        }
        window.history.replaceState(null, '', window.location.pathname);
      } else if (urlToken) {
        safeSetToken(urlToken);
        setToken(urlToken);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const currentToken = urlToken || safeGetToken();
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
    authError,
    clearAuthError,
    loginWithProvider,
    logout,
    refreshUser: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../services/api';

let mockStoredToken = null;

vi.mock('../services/api', () => ({
  api: {
    getMe: vi.fn(),
    getAuthToken: vi.fn(() => mockStoredToken),
    setAuthToken: vi.fn((token) => {
      mockStoredToken = token;
    }),
    getOAuthLoginUrl: vi.fn((provider) => `http://localhost:8000/auth/${provider}/login`),
    logout: vi.fn(),
  },
}));

function ConsumerComponent() {
  const { user, token, isAuthenticated, authError, clearAuthError, loginWithProvider } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="auth-error">{authError || 'no-error'}</div>
      <div data-testid="user-email">{user?.email || 'no-email'}</div>
      <button onClick={() => loginWithProvider('github')}>Login GitHub</button>
      <button onClick={clearAuthError}>Clear Error</button>
    </div>
  );
}

describe('AuthContext Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoredToken = null;
    window.location.hash = '';
    window.location.search = '';
    localStorage.clear();
  });

  it('captura auth_error a partir do fragmento hash e limpa o hash da URL', async () => {
    window.location.hash = '#auth_error=Consentimento%20Recusado';

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toHaveTextContent('Consentimento Recusado');
    });

    expect(window.location.hash).toBe('');
  });

  it('captura token a partir do fragmento hash, salva e busca perfil', async () => {
    window.location.hash = '#token=valid_mock_jwt';
    api.getMe.mockResolvedValue({ id: 1, email: 'user@test.com', nome: 'Usuario' });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('user@test.com');
    });

    expect(api.setAuthToken).toHaveBeenCalledWith('valid_mock_jwt');
    expect(window.location.hash).toBe('');
  });
});

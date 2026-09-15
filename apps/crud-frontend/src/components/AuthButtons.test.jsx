import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthButtons from './AuthButtons';
import * as AuthContextModule from '../context/AuthContext';

describe('AuthButtons Component Tests', () => {
  it('renderiza os botões de autenticação para GitHub e Google', () => {
    render(<AuthButtons />);
    expect(screen.getByRole('button', { name: /entrar com github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
  });

  it('renderiza no modo compacto quando a prop compact é verdadeira', () => {
    render(<AuthButtons compact />);
    expect(screen.getByRole('button', { name: /entrar com github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('aciona loginWithProvider ao clicar nos botões', () => {
    const mockLogin = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithProvider: mockLogin,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<AuthButtons />);
    const githubBtn = screen.getByRole('button', { name: /entrar com github/i });
    githubBtn.click();
    expect(mockLogin).toHaveBeenCalledWith('github');

    const googleBtn = screen.getByRole('button', { name: /entrar com google/i });
    googleBtn.click();
    expect(mockLogin).toHaveBeenCalledWith('google');
  });
});

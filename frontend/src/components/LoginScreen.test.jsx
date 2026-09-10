import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginScreen from './LoginScreen';
import * as AuthContextModule from '../context/AuthContext';

describe('LoginScreen Component Tests (TDD)', () => {
  const mockLoginWithProvider = vi.fn();
  const mockLogout = vi.fn();
  const mockClearAuthError = vi.fn();
  const mockNavigateToDashboard = vi.fn();

  const defaultAuthContext = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    clearAuthError: mockClearAuthError,
    loginWithProvider: mockLoginWithProvider,
    logout: mockLogout,
    refreshUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ ...defaultAuthContext });
  });

  it('renderiza o cabeçalho da tela com título e descrição de autenticação', () => {
    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    expect(screen.getByRole('heading', { level: 1, name: /acesse sua conta/i })).toBeInTheDocument();
    expect(screen.getByText(/gerenciamento seguro de usuários/i)).toBeInTheDocument();
  });

  it('renderiza os botões OAuth proeminentes para GitHub e Google', () => {
    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    expect(screen.getByRole('button', { name: /continuar com github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar com google/i })).toBeInTheDocument();
  });

  it('renderiza a lista de garantias e segurança do sistema', () => {
    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    expect(screen.getByText(/proteção anti-csrf/i)).toBeInTheDocument();
    expect(screen.getByText(/sessão jwt assinada/i)).toBeInTheDocument();
    expect(screen.getByText(/vinculação automática de contas/i)).toBeInTheDocument();
  });

  it('aciona loginWithProvider com "github" ao clicar no botão do GitHub', () => {
    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    const githubBtn = screen.getByRole('button', { name: /continuar com github/i });
    fireEvent.click(githubBtn);

    expect(mockLoginWithProvider).toHaveBeenCalledTimes(1);
    expect(mockLoginWithProvider).toHaveBeenCalledWith('github');
  });

  it('aciona loginWithProvider com "google" ao clicar no botão do Google', () => {
    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    const googleBtn = screen.getByRole('button', { name: /continuar com google/i });
    fireEvent.click(googleBtn);

    expect(mockLoginWithProvider).toHaveBeenCalledTimes(1);
    expect(mockLoginWithProvider).toHaveBeenCalledWith('google');
  });

  it('aciona onNavigateToDashboard ao clicar no botão de continuar como visitante', () => {
    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    const backBtn = screen.getByRole('button', { name: /continuar como visitante/i });
    fireEvent.click(backBtn);

    expect(mockNavigateToDashboard).toHaveBeenCalledTimes(1);
  });

  it('exibe banner de alerta e aciona clearAuthError quando authError estiver presente', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...defaultAuthContext,
      authError: 'Falha na autorização do provedor.',
    });

    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    expect(screen.getByText('Falha na autorização do provedor.')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dispensar alerta/i });
    fireEvent.click(dismissBtn);

    expect(mockClearAuthError).toHaveBeenCalledTimes(1);
  });

  it('renderiza card de sessão ativa quando o usuário já estiver autenticado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...defaultAuthContext,
      isAuthenticated: true,
      user: {
        id: 1,
        nome: 'Guilherme',
        sobrenome: 'Silva',
        email: 'guilherme@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        linked_providers: ['github'],
      },
    });

    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    expect(screen.getByText(/você já está conectado/i)).toBeInTheDocument();
    expect(screen.getByText('Guilherme Silva')).toBeInTheDocument();
    expect(screen.getByText('guilherme@example.com')).toBeInTheDocument();

    const goToDashboardBtn = screen.getByRole('button', { name: /ir para o painel/i });
    fireEvent.click(goToDashboardBtn);
    expect(mockNavigateToDashboard).toHaveBeenCalledTimes(1);

    const logoutBtn = screen.getByRole('button', { name: /encerrar sessão/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('exibe indicador de carregamento quando isLoading for verdadeiro', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...defaultAuthContext,
      isLoading: true,
    });

    render(<LoginScreen onNavigateToDashboard={mockNavigateToDashboard} />);

    expect(screen.getByTestId('login-loading-spinner')).toBeInTheDocument();
  });
});

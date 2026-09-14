import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './Navbar';
import * as AuthContextModule from '../context/AuthContext';

describe('Navbar Component Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza o título da aplicação', () => {
    render(<Navbar totalUsers={5} isOnline={true} />);
    expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument();
    expect(screen.getByText('CRUD com FastAPI, PostgreSQL & React')).toBeInTheDocument();
  });

  it('exibe a contagem correta no singular e plural', () => {
    const { rerender } = render(<Navbar totalUsers={1} isOnline={true} />);
    expect(screen.getByText('usuário')).toBeInTheDocument();

    rerender(<Navbar totalUsers={3} isOnline={true} />);
    expect(screen.getByText('usuários')).toBeInTheDocument();
  });

  it('mostra status online e offline corretamente', () => {
    const { rerender } = render(<Navbar totalUsers={0} isOnline={true} />);
    expect(screen.getByText('API Conectada')).toBeInTheDocument();

    rerender(<Navbar totalUsers={0} isOnline={false} />);
    expect(screen.getByText('API Desconectada')).toBeInTheDocument();
  });

  it('exibe botões de login OAuth quando não autenticado', () => {
    render(<Navbar totalUsers={0} isOnline={true} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('exibe perfil do usuário e botão de logout quando autenticado', () => {
    const mockLogout = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        nome: 'Guilherme',
        email: 'guilherme@example.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/1',
      },
      token: 'jwt_token',
      isAuthenticated: true,
      isLoading: false,
      loginWithProvider: vi.fn(),
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(<Navbar totalUsers={10} isOnline={true} />);
    expect(screen.getByText('Guilherme')).toBeInTheDocument();
    expect(screen.getByText('guilherme@example.com')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /encerrar sessão/i });
    expect(logoutBtn).toBeInTheDocument();
    logoutBtn.click();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('exibe o badge identificador de ambiente DEV', () => {
    render(<Navbar totalUsers={2} isOnline={true} />);
    expect(screen.getByText('Ambiente: DEV')).toBeInTheDocument();
  });

  it('chama onNavigateToLogin ao clicar no botão Fazer Login quando fornecido', () => {
    const handleLogin = vi.fn();
    render(
      <Navbar
        totalUsers={0}
        isOnline={true}
        onNavigateToLogin={handleLogin}
        currentView="dashboard"
      />
    );
    const loginBtn = screen.getByRole('button', { name: /fazer login/i });
    expect(loginBtn).toBeInTheDocument();
    loginBtn.click();
    expect(handleLogin).toHaveBeenCalledTimes(1);
  });

  it('chama onNavigateToDashboard ao clicar no botão Ir para o Painel quando na tela de login', () => {
    const handleDashboard = vi.fn();
    render(
      <Navbar
        totalUsers={0}
        isOnline={true}
        onNavigateToDashboard={handleDashboard}
        currentView="login"
      />
    );
    const dashboardBtn = screen.getByRole('button', { name: /ir para o painel/i });
    expect(dashboardBtn).toBeInTheDocument();
    dashboardBtn.click();
    expect(handleDashboard).toHaveBeenCalledTimes(1);
  });
});

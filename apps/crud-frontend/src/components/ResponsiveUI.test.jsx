import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';
import UserDetailModal from './UserDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import Toast from './Toast';
import * as AuthContextModule from '../context/AuthContext';

describe('Responsive UI & Layout Test Suite', () => {
  // -------------------------------------------------------------
  // 1. Navbar Responsive Elements & Auth States
  // -------------------------------------------------------------
  describe('Navbar Responsiveness', () => {
    it('renderiza contêineres semânticos navbar-inner e navbar-controls para flexibilidade mobile', () => {
      const { container } = render(<Navbar totalUsers={12} isOnline={true} />);
      
      const navbarInner = container.querySelector('.navbar-inner');
      expect(navbarInner).toBeInTheDocument();

      const navbarControls = container.querySelector('.navbar-controls');
      expect(navbarControls).toBeInTheDocument();
      expect(screen.getByText('API Conectada')).toBeInTheDocument();
    });

    it('renderiza botões compactos de login no mobile quando não autenticado', () => {
      const { container } = render(<Navbar totalUsers={0} isOnline={true} />);
      const authGroup = container.querySelector('.auth-buttons-group.compact');
      expect(authGroup).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar com github/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
    });

    it('renderiza avatar e dados do usuário quando autenticado com suporte a telas móveis', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: {
          id: 42,
          nome: 'Maria',
          sobrenome: 'Santos',
          email: 'maria@example.com',
          avatar_url: 'https://lh3.googleusercontent.com/a/photo',
        },
        token: 'valid_jwt',
        isAuthenticated: true,
        isLoading: false,
        loginWithProvider: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      const { container } = render(<Navbar totalUsers={42} isOnline={true} />);
      const badge = container.querySelector('.user-profile-badge');
      expect(badge).toBeInTheDocument();

      const avatarImg = container.querySelector('.user-avatar-img');
      expect(avatarImg).toBeInTheDocument();
      expect(avatarImg).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/photo');
      expect(screen.getByText('Maria')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /encerrar sessão/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------
  // 2. UserTable Responsive Container & Touch Targets
  // -------------------------------------------------------------
  describe('UserTable Responsive Layout', () => {
    const mockUsers = [
      {
        id: 1,
        nome: 'Carlos',
        sobrenome: 'Ferreira',
        email: 'carlos@example.com',
        telefone: '(11) 98765-4321',
        cidade: 'São Paulo',
        estado: 'SP',
        created_at: '2026-09-09T12:00:00Z',
      },
    ];

    it('envolve a tabela em um contêiner table-wrapper para rolagem horizontal suave no mobile', () => {
      const { container } = render(
        <UserTable
          users={mockUsers}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          onNewUser={vi.fn()}
        />
      );

      const tableWrapper = container.querySelector('.table-wrapper');
      expect(tableWrapper).toBeInTheDocument();
      expect(tableWrapper.querySelector('table')).toBeInTheDocument();
    });

    it('possui classe date-col na coluna de data para ocultação limpa em telas móveis', () => {
      const { container } = render(
        <UserTable
          users={mockUsers}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          onNewUser={vi.fn()}
        />
      );

      const dateHeader = container.querySelector('th.date-col');
      expect(dateHeader).toBeInTheDocument();
      const dateCell = container.querySelector('td.date-col');
      expect(dateCell).toBeInTheDocument();
    });

    it('botões de ação possuem rótulos acessíveis (aria-label) para acessibilidade móvel e leitores de tela', () => {
      render(
        <UserTable
          users={mockUsers}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          onNewUser={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /ver detalhes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /excluir/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------
  // 3. Modais & Formulários Adaptativos
  // -------------------------------------------------------------
  describe('Modais Responsivos', () => {
    it('UserFormModal renderiza classes de grid responsivo (form-grid-2, form-grid-3) e scroll interno', () => {
      const { container } = render(
        <UserFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initialData={null}
          isSubmitting={false}
        />
      );

      expect(container.querySelector('.modal-form-large')).toBeInTheDocument();
      expect(container.querySelector('.form-body-scroll')).toBeInTheDocument();
      expect(container.querySelector('.form-grid-2')).toBeInTheDocument();
      expect(container.querySelector('.form-grid-3')).toBeInTheDocument();
    });

    it('UserDetailModal renderiza imagem de avatar se presente e grid responsivo', () => {
      const userWithAvatar = {
        id: 77,
        nome: 'Julia',
        sobrenome: 'Melo',
        email: 'julia@example.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/77',
        cidade: 'Curitiba',
        estado: 'PR',
      };

      const { container } = render(
        <UserDetailModal
          isOpen={true}
          user={userWithAvatar}
          onClose={vi.fn()}
        />
      );

      const avatarImg = container.querySelector('.avatar.large');
      expect(avatarImg).toHaveAttribute('src', 'https://avatars.githubusercontent.com/u/77');
      expect(container.querySelector('.detail-grid')).toBeInTheDocument();
      expect(screen.getByText('Curitiba - PR')).toBeInTheDocument();
    });

    it('DeleteConfirmModal possui botões com alvos táteis e texto claro de cancelamento e exclusão', () => {
      const userToDelete = { id: 10, nome: 'Lucas', sobrenome: 'Alves' };
      render(
        <DeleteConfirmModal
          isOpen={true}
          user={userToDelete}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isDeleting={false}
        />
      );

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirmar exclusão/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------
  // 4. Toast Alerts Responsiveness
  // -------------------------------------------------------------
  describe('Toast Notifications Responsiveness', () => {
    it('renderiza contêiner de toast e botão de dispensar com acessibilidade', () => {
      const toasts = [
        { id: '1', message: 'Operação concluída com sucesso!', type: 'success' },
      ];
      const mockDismiss = vi.fn();

      const { container } = render(
        <Toast toasts={toasts} onDismiss={mockDismiss} />
      );

      const toastContainer = container.querySelector('.toast-container');
      expect(toastContainer).toBeInTheDocument();
      expect(screen.getByText('Operação concluída com sucesso!')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /fechar notificação/i });
      expect(closeBtn).toBeInTheDocument();
      closeBtn.click();
      expect(mockDismiss).toHaveBeenCalledWith('1');
    });
  });
});

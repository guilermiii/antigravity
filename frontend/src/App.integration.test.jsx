import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  api: {
    checkHealth: vi.fn(),
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('App Integration Tests (CRUD Flow)', () => {
  const initialUsers = [
    {
      id: 1,
      name: 'Alice Silva',
      email: 'alice@example.com',
      created_at: '2026-09-06T10:00:00Z',
    },
    {
      id: 2,
      name: 'Bruno Souza',
      email: 'bruno@example.com',
      created_at: '2026-09-06T10:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getUsers.mockResolvedValue([...initialUsers]);
  });

  it('carrega e exibe a listagem inicial de usuários da API', async () => {
    render(<App />);

    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
      expect(screen.getByText('Bruno Souza')).toBeInTheDocument();
    });

    expect(api.getUsers).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('usuários')).toBeInTheDocument();
  });

  it('filtra usuários em tempo real pelo campo de busca', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou e-mail/i);
    await user.type(searchInput, 'Bruno');

    expect(screen.getByText('Bruno Souza')).toBeInTheDocument();
    expect(screen.queryByText('Alice Silva')).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
  });

  it('fluxo de cadastro: abre modal, preenche dados, salva e adiciona na tabela', async () => {
    const user = userEvent.setup();
    const newUser = {
      id: 3,
      name: 'Carolina Mendes',
      email: 'carolina@example.com',
      created_at: '2026-09-06T12:00:00Z',
    };
    api.createUser.mockResolvedValueOnce(newUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    // Clica em "Novo Usuário"
    await user.click(screen.getByRole('button', { name: /novo usuário/i }));

    expect(screen.getByRole('heading', { name: 'Novo Usuário' })).toBeInTheDocument();

    // Preenche formulário
    await user.type(screen.getByLabelText(/nome completo/i), 'Carolina Mendes');
    await user.type(screen.getByLabelText(/endereço de e-mail/i), 'carolina@example.com');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({
        name: 'Carolina Mendes',
        email: 'carolina@example.com',
      });
      expect(screen.getByText('Carolina Mendes')).toBeInTheDocument();
      expect(screen.getByText('Usuário cadastrado com sucesso!')).toBeInTheDocument();
    });
  });

  it('fluxo de edição: altera os dados do usuário e atualiza a interface', async () => {
    const user = userEvent.setup();
    const updatedUser = {
      id: 1,
      name: 'Alice Silva Editada',
      email: 'alice@example.com',
      created_at: '2026-09-06T10:00:00Z',
    };
    api.updateUser.mockResolvedValueOnce(updatedUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    // Clica no botão de editar do primeiro usuário
    const editBtns = screen.getAllByRole('button', { name: /editar/i });
    await user.click(editBtns[0]);

    expect(screen.getByRole('heading', { name: 'Editar Usuário' })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/nome completo/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Silva Editada');

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith(1, {
        name: 'Alice Silva Editada',
        email: 'alice@example.com',
      });
      expect(screen.getByText('Alice Silva Editada')).toBeInTheDocument();
      expect(screen.getByText('Usuário atualizado com sucesso!')).toBeInTheDocument();
    });
  });

  it('fluxo de exclusão: confirma a exclusão no modal e remove da tabela', async () => {
    const user = userEvent.setup();
    api.deleteUser.mockResolvedValueOnce(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Bruno Souza')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole('button', { name: /excluir/i });
    await user.click(deleteBtns[1]); // Clica no botão de excluir de Bruno

    expect(screen.getByText(/tem certeza que deseja excluir o usuário/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirmar exclusão/i }));

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith(2);
      expect(screen.queryByText('Bruno Souza')).not.toBeInTheDocument();
      expect(screen.getByText('Usuário removido com sucesso!')).toBeInTheDocument();
    });
  });

  it('trata e exibe erro do backend via notificação Toast', async () => {
    const user = userEvent.setup();
    api.createUser.mockRejectedValueOnce(
      new Error('Já existe um usuário cadastrado com este e-mail.')
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /novo usuário/i }));
    expect(screen.getByRole('heading', { name: 'Novo Usuário' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/nome completo/i), 'Alice Clone');
    await user.type(screen.getByLabelText(/endereço de e-mail/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Já existe um usuário cadastrado com este e-mail.')
      ).toBeInTheDocument();
    });
  });
});

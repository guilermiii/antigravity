import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
      nome: 'Alice',
      sobrenome: 'Silva',
      email: 'alice@example.com',
      telefone: '(11) 91111-2222',
      cidade: 'São Paulo',
      estado: 'SP',
      created_at: '2026-09-06T10:00:00Z',
    },
    {
      id: 2,
      nome: 'Bruno',
      sobrenome: 'Souza',
      email: 'bruno@example.com',
      telefone: '(21) 93333-4444',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
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

  it('filtra usuários em tempo real pelo campo de busca por nome ou sobrenome', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nome/i);
    await user.type(searchInput, 'Bruno');

    expect(screen.getByText('Bruno Souza')).toBeInTheDocument();
    expect(screen.queryByText('Alice Silva')).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
  });

  it('fluxo de cadastro: abre modal, preenche dados obrigatórios e opcionais, salva e adiciona na tabela', async () => {
    const user = userEvent.setup();
    const newUser = {
      id: 3,
      nome: 'Carolina',
      sobrenome: 'Mendes',
      email: 'carolina@example.com',
      telefone: '(31) 98888-7777',
      idade: 29,
      genero: 'Feminino',
      cpf: '52998224725',
      rua: 'Rua das Flores',
      numero: '100',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30100-000',
      pais: 'Brasil',
      escolaridade: 'Ensino Superior',
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
    await user.type(screen.getByLabelText(/^Nome \*/i), 'Carolina');
    await user.type(screen.getByLabelText(/^Sobrenome \*/i), 'Mendes');
    await user.type(screen.getByLabelText(/^Endereço de E-mail \*/i), 'carolina@example.com');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Carolina',
          sobrenome: 'Mendes',
          email: 'carolina@example.com',
        })
      );
      expect(screen.getByText('Carolina Mendes')).toBeInTheDocument();
      expect(screen.getByText('Usuário cadastrado com sucesso!')).toBeInTheDocument();
    });
  });

  it('fluxo de visualização de detalhes do usuário', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    const detailBtns = screen.getAllByRole('button', { name: /ver detalhes/i });
    await user.click(detailBtns[0]);

    expect(screen.getByText('Detalhes do Usuário')).toBeInTheDocument();
    expect(screen.getAllByText('Alice Silva').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('alice@example.com').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('(11) 91111-2222').length).toBeGreaterThanOrEqual(2);

    const closeDetailBtns = screen.getAllByRole('button', { name: /fechar/i });
    await user.click(closeDetailBtns[0]);
    expect(screen.queryByText('Detalhes do Usuário')).not.toBeInTheDocument();
  });

  it('fluxo de edição: altera o sobrenome do usuário e atualiza a interface', async () => {
    const user = userEvent.setup();
    const updatedUser = {
      id: 1,
      nome: 'Alice',
      sobrenome: 'Silva Editada',
      email: 'alice@example.com',
      created_at: '2026-09-06T10:00:00Z',
    };
    api.updateUser.mockResolvedValueOnce(updatedUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button', { name: /editar/i });
    await user.click(editBtns[0]);

    expect(screen.getByRole('heading', { name: 'Editar Usuário' })).toBeInTheDocument();
    const sobrenomeInput = screen.getByLabelText(/^Sobrenome \*/i);
    await user.clear(sobrenomeInput);
    await user.type(sobrenomeInput, 'Silva Editada');

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sobrenome: 'Silva Editada',
        })
      );
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
    await user.click(deleteBtns[1]);

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
    await user.type(screen.getByLabelText(/^Nome \*/i), 'Alice');
    await user.type(screen.getByLabelText(/^Sobrenome \*/i), 'Clone');
    await user.type(screen.getByLabelText(/^Endereço de E-mail \*/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Já existe um usuário cadastrado com este e-mail.')
      ).toBeInTheDocument();
    });
  });

  it('permite navegar para a tela de login pelo botão da Navbar e retornar ao painel como visitante', async () => {
    const user = userEvent.setup();
    window.location.hash = '';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });

    const loginNavBtn = screen.getByRole('button', { name: /fazer login/i });
    await user.click(loginNavBtn);

    expect(screen.getByText('Acesse sua Conta')).toBeInTheDocument();
    expect(screen.getByText('Continuar com GitHub')).toBeInTheDocument();
    expect(screen.getByText('Continuar com Google')).toBeInTheDocument();
    expect(screen.queryByText('Alice Silva')).not.toBeInTheDocument();

    const guestBtn = screen.getByRole('button', { name: /continuar como visitante/i });
    await user.click(guestBtn);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });
  });

  it('renderiza a tela de login diretamente se inicializado com hash #login', async () => {
    const user = userEvent.setup();
    window.location.hash = '#login';
    render(<App />);

    await waitFor(() => {
      expect(api.getUsers).toHaveBeenCalled();
    });

    expect(screen.getByText('Acesse sua Conta')).toBeInTheDocument();
    expect(screen.queryByText('Alice Silva')).not.toBeInTheDocument();

    const guestBtn = screen.getByRole('button', { name: /continuar como visitante/i });
    await user.click(guestBtn);

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    });
    window.location.hash = '';
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UserTable from './UserTable';

describe('UserTable Component Tests', () => {
  const mockUsers = [
    {
      id: 1,
      nome: 'Maria',
      sobrenome: 'Oliveira',
      email: 'maria@example.com',
      telefone: '(11) 98765-4321',
      cidade: 'São Paulo',
      estado: 'SP',
      created_at: '2026-09-06T10:00:00Z',
    },
    {
      id: 2,
      nome: 'João',
      sobrenome: 'Santos',
      email: 'joao@example.com',
      telefone: null,
      cidade: null,
      estado: null,
      created_at: '2026-09-06T11:00:00Z',
    },
  ];

  it('exibe estado de carregamento quando isLoading é verdadeiro', () => {
    render(
      <UserTable
        users={[]}
        isLoading={true}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
        onNewUser={() => {}}
      />
    );
    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();
  });

  it('exibe estado vazio quando a lista de usuários está vazia', () => {
    render(
      <UserTable
        users={[]}
        isLoading={false}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
        onNewUser={() => {}}
      />
    );
    expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar primeiro usuário/i })).toBeInTheDocument();
  });

  it('renderiza os dados dos usuários na tabela com nome e sobrenome', () => {
    render(
      <UserTable
        users={mockUsers}
        isLoading={false}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
        onNewUser={() => {}}
      />
    );

    expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('MO')).toBeInTheDocument(); // Iniciais
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();

    expect(screen.getByText('João Santos')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument(); // Iniciais
  });

  it('aciona callbacks de detalhes, edição e exclusão ao clicar nos respectivos botões', async () => {
    const user = userEvent.setup();
    const handleView = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <UserTable
        users={mockUsers}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onNewUser={() => {}}
      />
    );

    const viewButtons = screen.getAllByRole('button', { name: /ver detalhes/i });
    await user.click(viewButtons[0]);
    expect(handleView).toHaveBeenCalledWith(mockUsers[0]);

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    await user.click(editButtons[0]);
    expect(handleEdit).toHaveBeenCalledWith(mockUsers[0]);

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    await user.click(deleteButtons[1]);
    expect(handleDelete).toHaveBeenCalledWith(mockUsers[1]);
  });
});

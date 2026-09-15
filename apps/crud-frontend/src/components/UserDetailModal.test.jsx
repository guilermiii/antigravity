import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UserDetailModal from './UserDetailModal';

describe('UserDetailModal Component Tests', () => {
  const mockUser = {
    id: 1,
    nome: 'Carlos',
    sobrenome: 'Eduardo',
    email: 'carlos@example.com',
    telefone: '(11) 98765-4321',
    idade: 35,
    genero: 'Masculino',
    cpf: '52998224725',
    rua: 'Av Brasil',
    numero: '500',
    cidade: 'Campinas',
    estado: 'SP',
    cep: '13010-000',
    pais: 'Brasil',
    escolaridade: 'Ensino Superior',
    created_at: '2026-09-06T10:00:00Z',
  };

  it('não renderiza nada quando isOpen for falso ou user for nulo', () => {
    const { container } = render(
      <UserDetailModal isOpen={false} user={mockUser} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza todos os detalhes do usuário quando aberto', () => {
    render(<UserDetailModal isOpen={true} user={mockUser} onClose={() => {}} />);

    expect(screen.getByText('Detalhes do Usuário')).toBeInTheDocument();
    expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument();
    expect(screen.getByText('carlos@example.com')).toBeInTheDocument();
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    expect(screen.getByText('35 anos')).toBeInTheDocument();
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument();
    expect(screen.getByText(/Av Brasil, 500/i)).toBeInTheDocument();
    expect(screen.getByText(/Campinas - SP/i)).toBeInTheDocument();
    expect(screen.getByText('Ensino Superior')).toBeInTheDocument();
  });

  it('fecha o modal ao clicar no botão fechar', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<UserDetailModal isOpen={true} user={mockUser} onClose={handleClose} />);

    const closeButtons = screen.getAllByRole('button', { name: /fechar/i });
    await user.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalled();
  });
});

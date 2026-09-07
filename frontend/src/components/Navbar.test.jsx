import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Navbar from './Navbar';

describe('Navbar Component Tests', () => {
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
});

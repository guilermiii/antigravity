import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchitectureShowcase from './ArchitectureShowcase';

describe('ArchitectureShowcase Component', () => {
  it('renderiza os nós da arquitetura e detalhes da camada selecionada', () => {
    render(<ArchitectureShowcase />);

    expect(screen.getByText(/arquitetura em produção/i)).toBeInTheDocument();
    expect(screen.getByText('DuckDNS Resolver')).toBeInTheDocument();
    expect(screen.getAllByText('Nginx SSL Proxy').length).toBeGreaterThan(0);
    expect(screen.getByText('FastAPI Backend')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 16')).toBeInTheDocument();
    expect(screen.getByText('Prometheus Metrics')).toBeInTheDocument();
  });

  it('exibe detalhes técnicos específicos ao clicar em um nó diferente', async () => {
    const user = userEvent.setup();
    render(<ArchitectureShowcase />);

    const postgresNode = screen.getByRole('button', { name: /postgresql 16/i });
    await user.click(postgresNode);

    expect(screen.getByText(/banco de dados relacional com integridade estrita/i)).toBeInTheDocument();
    expect(screen.getAllByText(/check constraints/i).length).toBeGreaterThan(0);
  });
});

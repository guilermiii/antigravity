import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from './Hero';

describe('Hero Component', () => {
  it('exibe título principal, badge de disponibilidade e botões de chamada para ação', () => {
    render(<Hero />);

    expect(screen.getByText(/disponível para novas oportunidades/i)).toBeInTheDocument();
    expect(screen.getByText(/engenharia de plataforma & infraestrutura resiliente/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver projetos/i })).toHaveAttribute('href', '#projetos');
    expect(screen.getByRole('link', { name: /arquitetura cloud/i })).toHaveAttribute('href', '#arquitetura');
    expect(screen.getByRole('link', { name: /falar comigo/i })).toHaveAttribute('href', '#contato');
  });

  it('renderiza métricas rápidas de infraestrutura', () => {
    render(<Hero />);

    expect(screen.getByText('4 VMs')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('TLS 1.3')).toBeInTheDocument();
    expect(screen.getByText('0 Downtime')).toBeInTheDocument();
  });
});

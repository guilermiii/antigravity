import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Component (Portfolio SPA Integration)', () => {
  it('renderiza todas as seções principais da Landing Page', () => {
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText(/engenharia de plataforma & infraestrutura resiliente/i)).toBeInTheDocument();
    expect(screen.getByText(/guilherme@cloud-primary/i)).toBeInTheDocument();
    expect(screen.getByText(/arquitetura em produção/i)).toBeInTheDocument();
    expect(screen.getByText(/matriz de competências técnicas/i)).toBeInTheDocument();
    expect(screen.getByText(/projetos em destaque/i)).toBeInTheDocument();
    expect(screen.getByText(/vamos conversar\?/i)).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('permite alternar o tema da aplicação através do botão na navbar', async () => {
    const user = userEvent.setup();
    render(<App />);

    const themeBtn = screen.getByRole('button', { name: /alternar para modo/i });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await user.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

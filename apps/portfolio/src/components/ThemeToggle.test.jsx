import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../context/ThemeContext';

describe('ThemeToggle Component', () => {
  it('renderiza o botão com acessibilidade e alterna ícones ao clicar', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const btn = screen.getByRole('button', { name: /alternar para modo/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', 'Alternar para modo escuro');

    await user.click(btn);
    expect(btn).toHaveAttribute('aria-label', 'Alternar para modo claro');
  });
});

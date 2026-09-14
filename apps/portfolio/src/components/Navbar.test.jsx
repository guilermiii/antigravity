import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';
import { ThemeProvider } from '../context/ThemeContext';

describe('Navbar Component', () => {
  it('renderiza título, indicador de status e links de navegação principais', () => {
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    expect(screen.getByText('Guilherme')).toBeInTheDocument();
    expect(screen.getByText(/devops engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/infra operacional/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /sobre/i })).toHaveAttribute('href', '#sobre');
    expect(screen.getByRole('link', { name: /skills/i })).toHaveAttribute('href', '#skills');
    expect(screen.getByRole('link', { name: /projetos/i })).toHaveAttribute('href', '#projetos');
    expect(screen.getByRole('link', { name: /arquitetura/i })).toHaveAttribute('href', '#arquitetura');
    expect(screen.getByRole('link', { name: /contato/i })).toHaveAttribute('href', '#contato');
  });

  it('abre e fecha o menu mobile ao clicar no botão hamburguer', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    const mobileBtn = screen.getByRole('button', { name: /abrir menu/i });
    expect(mobileBtn).toBeInTheDocument();

    await user.click(mobileBtn);
    expect(screen.getByTestId('mobile-nav')).toBeVisible();

    await user.click(mobileBtn);
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

function TestConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Alternar Tema</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('inicia por padrão com tema claro caso não haja preferência salva', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('alterna tema para escuro e persiste no localStorage e no data-theme do documentElement', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const button = screen.getByTestId('toggle-btn');
    await user.click(button);

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('portfolio_theme')).toBe('dark');

    // Alterna de volta para light
    await user.click(button);
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('portfolio_theme')).toBe('light');
  });

  it('resgata tema previamente salvo no localStorage', () => {
    localStorage.setItem('portfolio_theme', 'dark');

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

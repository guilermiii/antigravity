import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Toast from './Toast';

describe('Toast Component Tests', () => {
  it('não renderiza nada se a lista de toasts for vazia', () => {
    const { container } = render(<Toast toasts={[]} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza toasts com mensagens e classes de sucesso e erro', () => {
    const toasts = [
      { id: 1, type: 'success', message: 'Sucesso ao salvar!' },
      { id: 2, type: 'error', message: 'Erro no servidor!' },
    ];
    render(<Toast toasts={toasts} onDismiss={() => {}} />);

    expect(screen.getByText('Sucesso ao salvar!')).toBeInTheDocument();
    expect(screen.getByText('Erro no servidor!')).toBeInTheDocument();
  });

  it('chama onDismiss ao clicar no botão fechar do toast', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();
    const toasts = [{ id: 42, type: 'success', message: 'Toast teste' }];

    render(<Toast toasts={toasts} onDismiss={handleDismiss} />);
    const closeBtn = screen.getByRole('button', { name: /fechar notificação/i });
    await user.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledWith(42);
  });
});

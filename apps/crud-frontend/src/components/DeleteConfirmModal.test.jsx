import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DeleteConfirmModal from './DeleteConfirmModal';

describe('DeleteConfirmModal Component Tests', () => {
  const mockUser = { id: 7, name: 'Rodrigo Lima', email: 'rodrigo@example.com' };

  it('não renderiza nada se isOpen for falso ou user for nulo', () => {
    const { container, rerender } = render(
      <DeleteConfirmModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        user={mockUser}
        isDeleting={false}
      />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <DeleteConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        user={null}
        isDeleting={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('exibe o nome e e-mail do usuário no diálogo', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        user={mockUser}
        isDeleting={false}
      />
    );

    expect(screen.getByText('Excluir Usuário')).toBeInTheDocument();
    expect(screen.getByText('Rodrigo Lima')).toBeInTheDocument();
    expect(screen.getByText('rodrigo@example.com')).toBeInTheDocument();
  });

  it('chama onConfirm ao clicar em Confirmar Exclusão', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={handleConfirm}
        user={mockUser}
        isDeleting={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /confirmar exclusão/i }));
    expect(handleConfirm).toHaveBeenCalledWith(7);
  });

  it('chama onClose ao clicar em Cancelar', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={() => {}}
        user={mockUser}
        isDeleting={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('mostra estado de exclusão em andamento quando isDeleting é verdadeiro', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        user={mockUser}
        isDeleting={true}
      />
    );

    expect(screen.getByText('Excluindo...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });
});

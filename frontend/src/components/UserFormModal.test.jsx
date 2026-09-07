import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UserFormModal from './UserFormModal';

describe('UserFormModal Component Tests', () => {
  it('não renderiza o modal quando isOpen for falso', () => {
    const { container } = render(
      <UserFormModal
        isOpen={false}
        onClose={() => {}}
        onSave={() => {}}
        initialData={null}
        isSubmitting={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza modo de criação quando initialData é nulo', () => {
    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        initialData={null}
        isSubmitting={false}
      />
    );
    expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar usuário/i })).toBeInTheDocument();
  });

  it('renderiza modo de edição com campos pré-preenchidos', () => {
    const initialData = { id: 10, name: 'Lucas Silva', email: 'lucas@example.com' };
    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        initialData={initialData}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lucas Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('lucas@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('exibe erros de validação quando campos estão vazios ou formato de e-mail é inválido', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSave={handleSave}
        initialData={null}
        isSubmitting={false}
      />
    );

    // Tentativa com campos vazios
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));
    expect(screen.getByText('O nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('O e-mail é obrigatório.')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();

    // Preenche nome e e-mail inválido
    await user.type(screen.getByLabelText(/nome completo/i), 'Fernando');
    await user.type(screen.getByLabelText(/endereço de e-mail/i), 'email_sem_arroba');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    expect(screen.getByText('Insira um formato de e-mail válido.')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('chama onSave com os dados válidos submetidos', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSave={handleSave}
        initialData={null}
        isSubmitting={false}
      />
    );

    await user.type(screen.getByLabelText(/nome completo/i), 'Camila Rocha');
    await user.type(screen.getByLabelText(/endereço de e-mail/i), 'camila@teste.com');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    expect(handleSave).toHaveBeenCalledWith({
      name: 'Camila Rocha',
      email: 'camila@teste.com',
    });
  });

  it('desabilita botões e exibe spinner quando isSubmitting é verdadeiro', () => {
    render(
      <UserFormModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        initialData={null}
        isSubmitting={true}
      />
    );

    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo/i)).toBeDisabled();
    expect(screen.getByLabelText(/endereço de e-mail/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });
});

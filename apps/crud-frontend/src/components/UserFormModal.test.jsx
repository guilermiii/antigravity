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

  it('renderiza modo de criação com campos obrigatórios e opcionais', () => {
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
    expect(screen.getByLabelText(/^Nome \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Sobrenome \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Endereço de E-mail \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Idade$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar usuário/i })).toBeInTheDocument();
  });

  it('renderiza modo de edição com campos pré-preenchidos', () => {
    const initialData = {
      id: 10,
      nome: 'Lucas',
      sobrenome: 'Silva',
      email: 'lucas@example.com',
      telefone: '(11) 98765-4321',
      cidade: 'Campinas',
    };
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
    expect(screen.getByDisplayValue('Lucas')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('lucas@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(11) 98765-4321')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('exibe erros de validação quando campos obrigatórios estão vazios', async () => {
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
    expect(screen.getByText('O sobrenome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('O e-mail é obrigatório.')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('chama onSave com apenas dados obrigatórios preenchidos', async () => {
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

    await user.type(screen.getByLabelText(/^Nome \*/i), 'Camila');
    await user.type(screen.getByLabelText(/^Sobrenome \*/i), 'Rocha');
    await user.type(screen.getByLabelText(/^Endereço de E-mail \*/i), 'camila@teste.com');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Camila',
        sobrenome: 'Rocha',
        email: 'camila@teste.com',
      })
    );
  });

  it('valida formato de CPF quando informado e exibe erro se inválido', async () => {
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

    await user.type(screen.getByLabelText(/^Nome \*/i), 'Camila');
    await user.type(screen.getByLabelText(/^Sobrenome \*/i), 'Rocha');
    await user.type(screen.getByLabelText(/^Endereço de E-mail \*/i), 'camila@teste.com');
    await user.type(screen.getByLabelText(/cpf/i), '111.111.111-11');
    await user.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
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
    expect(screen.getByLabelText(/^Nome \*/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Sobrenome \*/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Endereço de E-mail \*/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });
});

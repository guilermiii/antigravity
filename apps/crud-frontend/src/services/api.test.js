import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

describe('API Service Unit Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkHealth faz requisição GET / com sucesso', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'API online' }),
    });

    const res = await api.checkHealth();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/'));
    expect(res).toEqual({ message: 'API online' });
  });

  it('getUsers busca lista de usuários com paginação', async () => {
    const mockUsers = [
      { id: 1, nome: 'Alice', sobrenome: 'Silva', email: 'alice@test.com' },
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUsers,
    });

    const res = await api.getUsers(0, 50);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/?skip=0&limit=50'));
    expect(res).toEqual(mockUsers);
  });

  it('createUser envia POST com dados no corpo da requisição', async () => {
    const newUser = {
      nome: 'Bob',
      sobrenome: 'Santos',
      email: 'bob@test.com',
      telefone: '(11) 98765-4321',
      idade: 30,
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, ...newUser }),
    });

    const res = await api.createUser(newUser);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
    );
    expect(res.id).toBe(2);
    expect(res.nome).toBe('Bob');
    expect(res.sobrenome).toBe('Santos');
  });

  it('updateUser envia PUT com dados atualizados', async () => {
    const updateData = { sobrenome: 'Santos Editado', cidade: 'São Paulo' };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 2, nome: 'Bob', sobrenome: 'Santos Editado', email: 'bob@test.com' }),
    });

    const res = await api.updateUser(2, updateData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/2'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
    );
    expect(res.sobrenome).toBe('Santos Editado');
  });

  it('deleteUser envia DELETE e retorna null para status 204', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const res = await api.deleteUser(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/2'),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(res).toBeNull();
  });

  it('lança erro amigável quando backend retorna erro com detail string', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'E-mail já cadastrado.' }),
    });

    await expect(
      api.createUser({ nome: 'A', sobrenome: 'B', email: 'a@a.com' })
    ).rejects.toThrow('E-mail já cadastrado.');
  });

  it('lança erro amigável quando backend retorna erro de validação (array detail)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [{ msg: 'value is not a valid email address' }],
      }),
    });

    await expect(
      api.createUser({ nome: 'A', sobrenome: 'B', email: 'invalido' })
    ).rejects.toThrow('value is not a valid email address');
  });
});

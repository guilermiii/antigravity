const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'Ocorreu um erro na requisição.';
    try {
      const data = await response.json();
      if (data && data.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
        }
      }
    } catch {
      errorMessage = `Erro ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  return await response.json();
}

export const api = {
  async checkHealth() {
    const res = await fetch(`${API_BASE_URL}/`);
    return await handleResponse(res);
  },

  async getUsers(skip = 0, limit = 100) {
    const res = await fetch(`${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`);
    return await handleResponse(res);
  },

  async getUser(id) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`);
    return await handleResponse(res);
  },

  async createUser(userData) {
    const res = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await handleResponse(res);
  },

  async updateUser(id, userData) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await handleResponse(res);
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return await handleResponse(res);
  },
};

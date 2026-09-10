const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authToken = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('auth_token') : null;

export const setAuthToken = (token) => {
  authToken = token;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (token) {
      window.localStorage.setItem('auth_token', token);
    } else {
      window.localStorage.removeItem('auth_token');
    }
  }
};

export const getAuthToken = () => authToken;

function getHeaders(contentType = 'application/json') {
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return Object.keys(headers).length > 0 ? headers : null;
}

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
  setAuthToken,
  getAuthToken,

  getOAuthLoginUrl(provider) {
    return `${API_BASE_URL}/auth/${provider}/login`;
  },

  async getMe() {
    const headers = getHeaders(null);
    const res = await (headers
      ? fetch(`${API_BASE_URL}/auth/me`, { headers })
      : fetch(`${API_BASE_URL}/auth/me`));
    return await handleResponse(res);
  },

  async logout() {
    try {
      const headers = getHeaders(null);
      await (headers
        ? fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers })
        : fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' }));
    } catch {
      // Ignora falha de rede no logout remoto
    } finally {
      setAuthToken(null);
    }
  },

  async checkHealth() {
    const headers = getHeaders(null);
    const res = await (headers
      ? fetch(`${API_BASE_URL}/`, { headers })
      : fetch(`${API_BASE_URL}/`));
    return await handleResponse(res);
  },

  async getUsers(skip = 0, limit = 100) {
    const headers = getHeaders(null);
    const res = await (headers
      ? fetch(`${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`, { headers })
      : fetch(`${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`));
    return await handleResponse(res);
  },

  async getUser(id) {
    const headers = getHeaders(null);
    const res = await (headers
      ? fetch(`${API_BASE_URL}/users/${id}`, { headers })
      : fetch(`${API_BASE_URL}/users/${id}`));
    return await handleResponse(res);
  },

  async createUser(userData) {
    const headers = getHeaders('application/json') || { 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
    return await handleResponse(res);
  },

  async updateUser(id, userData) {
    const headers = getHeaders('application/json') || { 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    return await handleResponse(res);
  },

  async deleteUser(id) {
    const headers = getHeaders(null);
    const res = await (headers
      ? fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE', headers })
      : fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }));
    return await handleResponse(res);
  },
};

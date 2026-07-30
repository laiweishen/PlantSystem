const API_BASE = 'http://localhost:5011/api';

export const api = {
  // Test connection to C# backend
  testConnection: async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/test`);
      return await response.json();
    } catch (error) {
      console.error('Cannot connect to C# backend:', error);
      return null;
    }
  },

  // Auth endpoints
  login: async (username, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }
};
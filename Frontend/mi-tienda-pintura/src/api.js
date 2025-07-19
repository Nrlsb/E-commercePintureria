// src/api.js
import { useAuthStore } from './stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let accessToken = useAuthStore.getState().accessToken;

useAuthStore.subscribe(
  (state) => {
    accessToken = state.accessToken;
  }
);

const refreshToken = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Could not refresh token');
    }
    const data = await response.json();
    useAuthStore.getState().login(data.accessToken, data.user);
    return data.accessToken;
  } catch (error) {
    useAuthStore.getState().logout();
    return null;
  }
};

export const apiFetch = async (url, options = {}) => {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  // No establecer Content-Type para FormData; el navegador lo hace.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 403) {
    const newAccessToken = await refreshToken();
    if (newAccessToken) {
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
      });
    }
  }

  return response;
};

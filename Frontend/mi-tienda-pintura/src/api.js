// src/api.js
import { useAuthStore } from './stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Guardamos el token en la memoria del módulo para que persista entre renders
let accessToken = useAuthStore.getState().accessToken;

// Suscribirse a los cambios en el store para mantener el token actualizado
useAuthStore.subscribe(
  (state) => {
    accessToken = state.accessToken;
  }
);

// Función para refrescar el token
const refreshToken = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'GET',
      credentials: 'include', // Importante para enviar la cookie HttpOnly
    });
    if (!response.ok) {
      throw new Error('Could not refresh token');
    }
    const data = await response.json();
    useAuthStore.getState().login(data.accessToken, data.user); // Actualizar el store
    return data.accessToken;
  } catch (error) {
    useAuthStore.getState().logout(); // Si el refresh falla, desloguear
    return null;
  }
};

// Wrapper para fetch que maneja la autenticación y el refresco de token
export const apiFetch = async (url, options = {}) => {
  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  // Si el token expiró (403 Forbidden), intentar refrescarlo
  if (response.status === 403) {
    const newAccessToken = await refreshToken();
    if (newAccessToken) {
      // Reintentar la petición original con el nuevo token
      response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });
    }
  }

  return response;
};

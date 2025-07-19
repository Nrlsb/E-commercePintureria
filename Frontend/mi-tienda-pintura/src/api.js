// src/api.js
import { useAuthStore } from './stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let accessToken = useAuthStore.getState().accessToken;

// Suscribirse a los cambios del store para mantener el token actualizado
useAuthStore.subscribe(
  (state) => {
    accessToken = state.accessToken;
  }
);

const refreshToken = async () => {
  try {
    // --- CORRECCIÓN: Añadir 'credentials: include' para enviar la cookie ---
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'GET',
      credentials: 'include', // ¡Esta línea es crucial!
    });
    if (!response.ok) {
      throw new Error('Could not refresh token');
    }
    const data = await response.json();
    useAuthStore.getState().login(data.accessToken, data.user);
    return data.accessToken;
  } catch (error) {
    // Si el refresco falla, deslogueamos al usuario
    useAuthStore.getState().logout();
    return null;
  }
};

export const apiFetch = async (url, options = {}) => {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // --- CORRECCIÓN: Añadir 'credentials: include' a todas las peticiones autenticadas ---
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Asegura que las cookies se envíen siempre
  };

  let response = await fetch(`${API_URL}${url}`, fetchOptions);

  // Si el token de acceso expiró (403), intentamos refrescarlo
  if (response.status === 403) {
    const newAccessToken = await refreshToken();
    if (newAccessToken) {
      // Reintentamos la petición original con el nuevo token
      fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_URL}${url}`, fetchOptions);
    }
  }

  return response;
};

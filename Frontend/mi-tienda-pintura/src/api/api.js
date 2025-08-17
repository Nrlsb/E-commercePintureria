// src/api/api.js
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let csrfToken = null;

const getCsrfToken = async () => {
  try {
    const response = await fetch(`${API_URL}/api/csrf-token`, { credentials: 'include' });
    if (!response.ok) throw new Error('Falló la obtención del token CSRF');
    const data = await response.json();
    csrfToken = data.csrfToken;
  } catch (error) {
    console.error("No se pudo obtener el token CSRF:", error);
  }
};

export const fetchWithCsrf = async (url, options = {}) => {
  if (!csrfToken) {
    await getCsrfToken();
  }

  const headers = new Headers(options.headers || {});
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  options.credentials = 'include';
  options.headers = headers;

  let response = await fetch(url, options);

  // --- INICIO DE LA LÓGICA DE EXPIRACIÓN DE SESIÓN ---
  // Si el token JWT expira, el backend devolverá 401 (No autorizado) o 403 (Prohibido).
  if (response.status === 401 || response.status === 403) {
    // Primero, verificamos si es un error de CSRF, que se maneja de forma diferente.
    const responseBody = await response.clone().json().catch(() => ({}));
    const isCsrfError = responseBody.message?.includes('CSRF');
    
    if (isCsrfError) {
      console.warn('Token CSRF inválido. Refrescando y reintentando...');
      await getCsrfToken();
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
        options.headers = headers;
        response = await fetch(url, options); // Reintentamos la petición una vez.
      }
    } else {
      // Si no es un error de CSRF, es probable que la sesión haya expirado.
      const { handleSessionExpired, user } = useAuthStore.getState();
      // Solo activamos el modal si había un usuario logueado.
      if (user) {
        handleSessionExpired();
      }
    }
  }
  // --- FIN DE LA LÓGICA DE EXPIRACIÓN DE SESIÓN ---

  return response;
};

let isInitialized = false;
export const initializeCsrf = () => {
    if (!isInitialized) {
        getCsrfToken();
        isInitialized = true;
    }
};

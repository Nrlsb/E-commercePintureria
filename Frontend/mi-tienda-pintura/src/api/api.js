// src/api/api.js

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

  const response = await fetch(url, options);

  if (response.status === 403) {
    console.warn('Token CSRF inválido. Refrescando y reintentando...');
    await getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
      options.headers = headers;
      return fetch(url, options);
    }
  }

  return response;
};

// --- CAMBIO: Se crea una función de inicialización para ser llamada una sola vez ---
let isInitialized = false;
export const initializeCsrf = () => {
    if (!isInitialized) {
        getCsrfToken();
        isInitialized = true;
    }
};

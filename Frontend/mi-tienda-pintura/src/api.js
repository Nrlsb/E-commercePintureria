// Frontend/mi-tienda-pintura/src/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Wrapper para la función fetch que añade configuraciones por defecto.
 * @param {string} endpoint - El endpoint de la API al que se llamará (ej. '/auth/login').
 * @param {object} [options={}] - Opciones de configuración para fetch.
 */
const apiFetch = async (endpoint, options = {}) => {
  const { body, ...customConfig } = options;

  const headers = { 'Content-Type': 'application/json' };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    // Incluye las cookies en todas las peticiones a la API
    credentials: 'include', 
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, config);
    
    if (response.status === 204) { // No Content
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      // Si la respuesta no es OK, lanzamos un error con el mensaje del backend
      return Promise.reject(data);
    }

    return data;
  } catch (error) {
    // Si hay un error de red o de parseo, lo devolvemos
    return Promise.reject(error);
  }
};

// Exportamos métodos específicos para conveniencia
export const api = {
  get: (endpoint, config) => apiFetch(endpoint, { ...config, method: 'GET' }),
  post: (endpoint, body, config) => apiFetch(endpoint, { ...config, body, method: 'POST' }),
  put: (endpoint, body, config) => apiFetch(endpoint, { ...config, body, method: 'PUT' }),
  delete: (endpoint, config) => apiFetch(endpoint, { ...config, method: 'DELETE' }),
};

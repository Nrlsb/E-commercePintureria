// Frontend/mi-tienda-pintura/src/utils/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Fetches the CSRF token from the backend.
 * Obtiene el token CSRF del backend.
 * @returns {Promise<string>} The CSRF token. El token CSRF.
 * @throws {Error} If the CSRF token cannot be fetched. Si el token CSRF no puede ser obtenido.
 */
async function getCsrfToken() {
  try {
    console.log('Attempting to fetch CSRF token from:', `${API_URL}/api/csrf-token`);
    const response = await fetch(`${API_URL}/api/csrf-token`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'No message provided' }));
      console.error('Failed to fetch CSRF token. Response status:', response.status, 'Error data:', errorData);
      throw new Error(errorData.message || `Failed to fetch CSRF token. Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched CSRF token:', data.csrfToken);
    return data.csrfToken;
  } catch (error) {
    console.error('Error in getCsrfToken:', error);
    throw error;
  }
}

/**
 * A wrapper around the native `fetch` API that automatically includes
 * the Authorization header and CSRF token for state-changing requests (POST, PUT, DELETE).
 * Un envoltorio alrededor de la API nativa `fetch` que incluye automáticamente
 * la cabecera de Autorización y el token CSRF para solicitudes que modifican el estado (POST, PUT, DELETE).
 *
 * @param {string} url The URL to fetch. La URL a la que hacer la solicitud.
 * @param {object} options The fetch options object. El objeto de opciones de fetch.
 * @param {string} token The authentication token (JWT). El token de autenticación (JWT).
 * @returns {Promise<Response>} The fetch Response object. El objeto Response de fetch.
 * @throws {Error} If the request fails or CSRF token cannot be obtained. Si la solicitud falla o el token CSRF no puede ser obtenido.
 */
export async function fetchAuthenticated(url, options = {}, token) {
  const headers = {
    ...options.headers,
  };

  // Add Authorization header if a token is provided
  // Añadir cabecera de Autorización si se proporciona un token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // For state-changing methods, fetch and include the CSRF token
  // Para métodos que modifican el estado, obtener e incluir el token CSRF
  const method = options.method ? options.method.toUpperCase() : 'GET';
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    try {
      const csrfToken = await getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
      console.log(`Adding X-CSRF-Token to ${method} request to ${url}:`, csrfToken);
      
      // Ensure Content-Type is set for body-carrying requests
      // Asegurar que Content-Type esté configurado para solicitudes que llevan cuerpo
      if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } catch (error) {
      console.error('Failed to prepare authenticated request with CSRF token:', error);
      throw new Error('CSRF token missing or invalid. Please try again. Token CSRF faltante o inválido. Por favor, inténtalo de nuevo.');
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

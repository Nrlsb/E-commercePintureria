// Frontend/mi-tienda-pintura/src/utils/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Fetches the CSRF token from the backend.
 * @returns {Promise<string>} The CSRF token.
 * @throws {Error} If the CSRF token cannot be fetched.
 */
async function getCsrfToken() {
  try {
    const response = await fetch(`${API_URL}/api/csrf-token`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch CSRF token.');
    }
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * A wrapper around the native `fetch` API that automatically includes
 * the Authorization header and CSRF token for state-changing requests (POST, PUT, DELETE).
 *
 * @param {string} url The URL to fetch.
 * @param {object} options The fetch options object.
 * @param {string} token The authentication token (JWT).
 * @returns {Promise<Response>} The fetch Response object.
 * @throws {Error} If the request fails or CSRF token cannot be obtained.
 */
export async function fetchAuthenticated(url, options = {}, token) {
  const headers = {
    ...options.headers,
  };

  // Add Authorization header if a token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // For state-changing methods, fetch and include the CSRF token
  const method = options.method ? options.method.toUpperCase() : 'GET';
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    try {
      const csrfToken = await getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
      // Ensure Content-Type is set for body-carrying requests
      if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } catch (error) {
      console.error('Failed to add CSRF token to request:', error);
      throw new Error('CSRF token missing or invalid. Please try again.');
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

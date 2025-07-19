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
  console.log('%c[Auth] Intentando refrescar el token...', 'color: blue; font-weight: bold;');
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'GET',
      credentials: 'include', // ¡Esta línea es crucial!
    });

    console.log('[Auth] Respuesta del servidor al refrescar:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth] Falló el refresco del token. Respuesta:', errorText);
      throw new Error('Could not refresh token');
    }
    
    const data = await response.json();
    console.log('%c[Auth] Token refrescado exitosamente.', 'color: green; font-weight: bold;');
    useAuthStore.getState().login(data.accessToken, data.user);
    return data.accessToken;
  } catch (error) {
    console.error('%c[Auth] Error catastrófico en refreshToken. Deslogueando...', 'color: red; font-weight: bold;', error);
    useAuthStore.getState().logout();
    return null;
  }
};

export const apiFetch = async (url, options = {}) => {
  console.log(`[API Fetch] Petición a: ${url} con token: ${accessToken ? accessToken.substring(0, 15) + '...' : 'null'}`);
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(`${API_URL}${url}`, fetchOptions);
  
  console.log(`[API Fetch] Respuesta inicial para ${url}:`, response.status, response.statusText);

  if (response.status === 403) {
    console.warn(`[API Fetch] Token expirado (403) para ${url}. Intentando refrescar.`);
    const newAccessToken = await refreshToken();

    if (newAccessToken) {
      console.log(`[API Fetch] Reintentando petición a ${url} con nuevo token.`);
      fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_URL}${url}`, fetchOptions);
      console.log(`[API Fetch] Respuesta del reintento para ${url}:`, response.status, response.statusText);
    } else {
       console.error(`[API Fetch] No se pudo obtener un nuevo token. La petición a ${url} falló.`);
    }
  }

  return response;
};

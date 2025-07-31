// src/api/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Almacenamos el token en una variable para no tener que pedirlo en cada petición
let csrfToken = null;

// Función para obtener el token del backend
const getCsrfToken = async () => {
  try {
    // Usamos 'credentials: include' para que el navegador envíe la cookie de sesión
    const response = await fetch(`${API_URL}/api/csrf-token`, { credentials: 'include' });
    if (!response.ok) throw new Error('Falló la obtención del token CSRF');
    const data = await response.json();
    csrfToken = data.csrfToken;
  } catch (error) {
    console.error("No se pudo obtener el token CSRF:", error);
    // Aquí podrías manejar el error, quizás mostrando un mensaje al usuario
  }
};

// Nuestro nuevo 'fetch' personalizado
export const fetchWithCsrf = async (url, options = {}) => {
  // Si aún no tenemos el token, lo pedimos
  if (!csrfToken) {
    await getCsrfToken();
  }

  // Preparamos las cabeceras (headers)
  const headers = new Headers(options.headers || {});
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  // Incluimos las credenciales (cookies) en todas las peticiones
  options.credentials = 'include';
  options.headers = headers;

  // Realizamos la petición original
  const response = await fetch(url, options);

  // Si la respuesta es un error de CSRF (403), intentamos refrescar el token y reintentar la petición una vez.
  if (response.status === 403) {
    console.warn('Token CSRF inválido. Refrescando y reintentando...');
    await getCsrfToken(); // Obtenemos un nuevo token
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
      options.headers = headers;
      return fetch(url, options); // Reintentamos la petición con el nuevo token
    }
  }

  return response;
};

// Inicializamos pidiendo el token cuando la app carga
getCsrfToken();

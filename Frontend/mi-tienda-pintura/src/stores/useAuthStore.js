// src/stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Parsea un token JWT para extraer la información del payload.
 * @param {string | null} token El token JWT.
 * @returns {object | null} El payload del token o null si es inválido.
 */
const parseJwt = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
};

export const useAuthStore = create(
  // El middleware `persist` envuelve la definición de nuestro store.
  persist(
    (set) => ({
      token: null,
      user: null,

      // La acción de login ahora solo se encarga de actualizar el estado.
      // La persistencia es automática.
      login: (newToken) => {
        set({
          token: newToken,
          user: parseJwt(newToken),
        });
      },

      // La acción de logout limpia el estado. `persist` se encargará de
      // limpiar el localStorage.
      logout: () => {
        set({
          token: null,
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage.
    }
  )
);

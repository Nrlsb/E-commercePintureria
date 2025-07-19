// src/stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      // La acción de login ahora guarda el accessToken y el usuario
      login: (newAccessToken, userData) => {
        set({
          accessToken: newAccessToken,
          user: userData || parseJwt(newAccessToken),
        });
      },

      // La acción de logout limpia el estado local
      // El borrado de la cookie y el token en BD se hace en el backend
      logout: () => {
        set({
          accessToken: null,
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Solo persistimos el usuario, el accessToken es volátil
      partialize: (state) => ({ user: state.user }),
    }
  )
);

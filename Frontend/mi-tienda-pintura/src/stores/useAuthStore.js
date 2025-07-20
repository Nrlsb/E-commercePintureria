// src/stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api'; // Importamos nuestro nuevo wrapper de API

export const useAuthStore = create(
  persist(
    (set) => ({
      // Ya no almacenamos el token, solo el usuario
      user: null,

      // La acción de login ahora solo recibe los datos del usuario
      login: (userData) => {
        set({ user: userData });
      },

      // La acción de logout ahora llama al endpoint del backend
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        } finally {
          set({ user: null });
        }
      },

      // Nueva acción para verificar el estado de la sesión al cargar la app
      checkAuthStatus: async () => {
        try {
          const data = await api.get('/auth/me');
          set({ user: data.user });
        } catch (error) {
          // Si hay un error (ej. 401), significa que no hay sesión válida
          set({ user: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Solo persistimos el objeto 'user'
      partialize: (state) => ({ user: state.user }),
    }
  )
);

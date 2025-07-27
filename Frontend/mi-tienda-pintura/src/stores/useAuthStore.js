// src/stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWishlistStore } from './useWishlistStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
    (set, get) => ({
      token: null,
      user: null,

      login: (newToken) => {
        set({
          token: newToken,
          user: parseJwt(newToken),
        });
        // Al iniciar sesión, cargar la lista de deseos del usuario.
        useWishlistStore.getState().fetchWishlist(newToken);
      },

      logout: () => {
        set({
          token: null,
          user: null,
        });
        // Al cerrar sesión, limpiar la lista de deseos del estado.
        useWishlistStore.getState().clearWishlist();
      },

      // NUEVO: Función para refrescar el token
      refreshToken: async () => {
        const currentToken = get().token;
        if (!currentToken) {
          console.warn("No hay token para refrescar.");
          get().logout(); // Si no hay token, forzar logout
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // Si el refresco falla (ej. token inválido o expirado con clave anterior),
            // el usuario debe volver a iniciar sesión.
            console.error("Fallo al refrescar el token:", await response.json());
            get().logout();
            return null;
          }

          const data = await response.json();
          const newToken = data.token;
          
          set({
            token: newToken,
            user: parseJwt(newToken),
          });
          console.log("Token refrescado exitosamente.");
          return newToken;

        } catch (error) {
          console.error("Error en la solicitud de refresco de token:", error);
          get().logout(); // Forzar logout en caso de error de red o servidor
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      // Solo persistimos el token y el usuario. La lógica de refresco no necesita ser persistida.
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

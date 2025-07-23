// src/stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWishlistStore } from './useWishlistStore'; // 1. Importar el store de wishlist

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
      token: null,
      user: null,

      login: (newToken) => {
        set({
          token: newToken,
          user: parseJwt(newToken),
        });
        // 2. Al iniciar sesión, cargar la lista de deseos del usuario.
        useWishlistStore.getState().fetchWishlist(newToken);
      },

      logout: () => {
        set({
          token: null,
          user: null,
        });
        // 3. Al cerrar sesión, limpiar la lista de deseos del estado.
        useWishlistStore.getState().clearWishlist();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

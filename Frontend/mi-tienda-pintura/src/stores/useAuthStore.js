// src/stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWishlistStore } from './useWishlistStore';
import { fetchWithCsrf } from '../api/api'; // Importar fetchWithCsrf

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
    (set) => ({
      token: null,
      user: null,

      login: (newToken) => {
        set({
          token: newToken,
          user: parseJwt(newToken),
        });
        useWishlistStore.getState().fetchWishlist(newToken);
      },

      logout: () => {
        set({
          token: null,
          user: null,
        });
        useWishlistStore.getState().clearWishlist();
      },
      
      refreshToken: async () => {
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) return;

        try {
          const response = await fetchWithCsrf(`${API_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          if (!response.ok) throw new Error('No se pudo refrescar el token.');
          const { token: newToken } = await response.json();
          set({
            token: newToken,
            user: parseJwt(newToken),
          });
        } catch (error) {
          console.error("Error refreshing token:", error);
          set({ token: null, user: null });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

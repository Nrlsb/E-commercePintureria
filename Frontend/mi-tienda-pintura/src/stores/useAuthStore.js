// src/stores/useAuthStore.js
import { create } from 'zustand';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('token') ? parseJwt(localStorage.getItem('token')) : null,

  // Acción para manejar un inicio de sesión exitoso
  login: (newToken) => {
    localStorage.setItem('token', newToken);
    set({
      token: newToken,
      user: parseJwt(newToken),
    });
  },

  // Acción para manejar el cierre de sesión
  logout: () => {
    localStorage.removeItem('token');
    set({
      token: null,
      user: null,
    });
  },
}));

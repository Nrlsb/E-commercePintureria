// src/stores/useNotificationStore.js
import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  message: '',
  show: false,
  
  // Acción para mostrar una notificación
  showNotification: (message) => {
    set({ message, show: true });
    // Oculta la notificación después de 3 segundos
    setTimeout(() => {
      set({ show: false });
    }, 3000);
  },
}));

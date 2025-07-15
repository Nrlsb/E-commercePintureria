// src/stores/useNotificationStore.js
import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  message: '',
  type: 'success', // Nuevo estado para el tipo: 'success' o 'error'
  show: false,
  
  /**
   * Muestra una notificación con un mensaje y un tipo específico.
   * @param {string} message - El mensaje a mostrar.
   * @param {string} [type='success'] - El tipo de notificación ('success' o 'error').
   */
  showNotification: (message, type = 'success') => {
    set({ message, type, show: true });
    // Oculta la notificación después de 3 segundos
    setTimeout(() => {
      set({ show: false });
    }, 3000);
  },
}));

// Frontend/mi-tienda-pintura/src/stores/useChatbotStore.js
import { create } from 'zustand';

/**
 * Store de Zustand para manejar el contexto del chatbot.
 * Esto permite que cualquier componente de la aplicación pueda
 * informar al chatbot sobre la página o producto que el usuario está viendo.
 */
export const useChatbotStore = create((set) => ({
  // El contexto actual, ej: { type: 'product', data: { ... } }
  context: null,
  // Acción para establecer un nuevo contexto
  setContext: (context) => set({ context }),
  // Acción para limpiar el contexto cuando el usuario navega a otra página
  clearContext: () => set({ context: null }),
}));

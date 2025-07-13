// src/stores/useProductStore.js
import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useProductStore = create((set) => ({
  products: [],
  loading: true,
  error: null,
  searchQuery: '',

  // Acción para buscar productos desde la API
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor');
      }
      const data = await response.json();
      set({ products: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Acción para actualizar el término de búsqueda
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

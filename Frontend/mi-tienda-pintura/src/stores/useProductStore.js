// src/stores/useProductStore.js
import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useProductStore = create((set, get) => ({
  products: [],
  allProducts: [], // Guardamos todos los productos para derivar filtros
  loading: true,
  error: null,
  searchQuery: '',
  
  // Nuevos estados para filtros y ordenamiento
  filters: {
    brands: [],
    minPrice: '',
    maxPrice: '',
  },
  sortOption: 'default',

  // Acción para buscar productos desde la API con filtros
  fetchProducts: async (category) => {
    set({ loading: true, error: null });
    const { filters, sortOption } = get();
    
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    if (sortOption !== 'default') {
      params.append('sortBy', sortOption);
    }
    if (filters.brands.length > 0) {
      params.append('brands', filters.brands.join(','));
    }
    if (filters.minPrice) {
      params.append('minPrice', filters.minPrice);
    }
    if (filters.maxPrice) {
      params.append('maxPrice', filters.maxPrice);
    }

    try {
      const response = await fetch(`${API_URL}/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor');
      }
      const data = await response.json();
      set({ products: data, loading: false });

      // Si es la primera carga (sin categoría), guardamos todos los productos
      if (!category && get().allProducts.length === 0) {
        set({ allProducts: data });
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Acción para actualizar los filtros
  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  },

  // Acción para actualizar la opción de ordenamiento
  setSortOption: (option) => {
    set({ sortOption: option });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

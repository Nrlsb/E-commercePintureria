// src/stores/useProductStore.js
import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useProductStore = create((set, get) => ({
  products: [],
  loading: true,
  error: null,
  searchQuery: '',
  
  filters: {
    brands: [],
    minPrice: '',
    maxPrice: '',
  },
  sortOption: 'default',

  fetchProducts: async (category) => {
    // --- CONSOLE LOG PARA DEBUGGING ---
    console.log(`%c[STORE] fetchProducts llamado con categoría: ${category || 'ninguna'}`, 'color: blue; font-weight: bold;');
    
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

    const fetchUrl = `${API_URL}/api/products?${params.toString()}`;
    // --- CONSOLE LOG PARA DEBUGGING ---
    console.log(`%c[STORE] Fetching URL: ${fetchUrl}`, 'color: green;');

    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor');
      }
      const data = await response.json();
      set({ products: data, loading: false });
    } catch (err) {
      // --- CONSOLE LOG PARA DEBUGGING ---
      console.error('%c[STORE] Error en fetchProducts:', 'color: red;', err);
      set({ error: err.message, loading: false });
    }
  },

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  },

  setSortOption: (option) => {
    set({ sortOption: option });
  },

  resetFiltersAndSort: () => {
    // --- CONSOLE LOG PARA DEBUGGING ---
    console.log('%c[STORE] Reseteando filtros y ordenamiento', 'color: orange;');
    set({
      filters: { brands: [], minPrice: '', maxPrice: '' },
      sortOption: 'default',
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

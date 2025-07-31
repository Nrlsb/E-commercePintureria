// src/stores/useProductStore.js
import { create } from 'zustand';
import { fetchWithCsrf } from '../api/api'; // Importar fetchWithCsrf

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useProductStore = create((set, get) => ({
  products: [],
  currentPage: 1,
  totalPages: 1,
  availableBrands: [],
  loading: true,
  error: null,
  searchQuery: '',
  
  quickViewProduct: null,

  filters: {
    brands: [],
    minPrice: '',
    maxPrice: '',
  },
  sortOption: 'default',

  fetchAvailableBrands: async () => {
    try {
      const response = await fetchWithCsrf(`${API_URL}/api/products/brands`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las marcas');
      }
      const data = await response.json();
      set({ availableBrands: data });
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  },

  fetchProducts: async (category, page = 1) => {
    set({ loading: true, error: null });
    const { filters, sortOption, searchQuery } = get();
    
    const params = new URLSearchParams();

    if (searchQuery) {
      params.append('searchQuery', searchQuery);
    }
    
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
    params.append('page', page);

    try {
      const response = await fetchWithCsrf(`${API_URL}/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor');
      }
      const data = await response.json();
      set({ 
        products: data.products, 
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        loading: false 
      });
    } catch (err) {
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
    set({
      filters: { brands: [], minPrice: '', maxPrice: '' },
      sortOption: 'default',
      currentPage: 1,
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),
}));

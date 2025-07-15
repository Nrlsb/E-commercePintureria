// src/stores/useProductStore.js
import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useProductStore = create((set, get) => ({
  products: [],
  // --- NUEVOS ESTADOS PARA PAGINACIÓN ---
  currentPage: 1,
  totalPages: 1,
  // ---
  availableBrands: [],
  loading: true,
  error: null,
  searchQuery: '',
  
  filters: {
    brands: [],
    minPrice: '',
    maxPrice: '',
  },
  sortOption: 'default',

  fetchAvailableBrands: async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/brands`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las marcas');
      }
      const data = await response.json();
      set({ availableBrands: data });
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  },

  // --- fetchProducts AHORA ACEPTA UN PARÁMETRO DE PÁGINA ---
  fetchProducts: async (category, page = 1) => {
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
    // Se añade el número de página a los parámetros de la petición
    params.append('page', page);

    try {
      const response = await fetch(`${API_URL}/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor');
      }
      const data = await response.json();
      // Se actualiza el estado con los productos y la información de paginación
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
      currentPage: 1, // También se resetea la página actual
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

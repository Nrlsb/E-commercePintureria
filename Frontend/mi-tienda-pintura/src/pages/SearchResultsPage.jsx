// src/pages/SearchResultsPage.jsx
import React from 'react';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx'; // Importamos la paginación
import { useProductStore } from '../stores/useProductStore.js';

const SearchResultsPage = () => {
  // --- MODIFICADO: Obtenemos todos los datos necesarios del store ---
  const { 
    products, 
    searchQuery, 
    loading, 
    error, 
    totalProducts, 
    currentPage, 
    totalPages,
    fetchProducts
  } = useProductStore(state => ({
    products: state.products,
    searchQuery: state.searchQuery,
    loading: state.loading,
    error: state.error,
    totalProducts: state.totalProducts,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    fetchProducts: state.fetchProducts,
  }));
  
  // --- NUEVO: Función para manejar el cambio de página ---
  const handlePageChange = (page) => {
    // Llamamos a fetchProducts sin categoría para que use el searchQuery del store
    fetchProducts(null, page); 
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Resultados para: <span className="text-blue-600">"{searchQuery}"</span></h1>
      {/* --- MODIFICADO: Usamos el totalProducts del store --- */}
      {!loading && <p className="text-gray-600 mb-8">{totalProducts} productos encontrados.</p>}
      
      {/* --- MODIFICADO: Pasamos directamente los productos del store, sin filtrar --- */}
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        loadingMessage={`Buscando productos para "${searchQuery}"...`}
      />

      {/* --- NUEVO: Añadimos el componente de paginación --- */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default SearchResultsPage;

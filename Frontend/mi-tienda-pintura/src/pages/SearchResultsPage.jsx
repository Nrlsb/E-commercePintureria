// src/pages/SearchResultsPage.jsx
import React from 'react';
import ProductGrid from '../components/ProductGrid.jsx'; // Se importa el nuevo componente
import { useProductStore } from '../stores/useProductStore.js';

const SearchResultsPage = () => {
  const products = useProductStore(state => state.products);
  const query = useProductStore(state => state.searchQuery);
  const loading = useProductStore(state => state.loading);
  const error = useProductStore(state => state.error);
  
  // La lógica de filtrado se mantiene aquí, ya que es específica de la búsqueda
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.brand.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Resultados para: <span className="text-blue-600">"{query}"</span></h1>
      {!loading && <p className="text-gray-600 mb-8">{filteredProducts.length} productos encontrados.</p>}
      
      {/* Se usa el componente ProductGrid, pasando los productos ya filtrados */}
      <ProductGrid
        products={filteredProducts}
        loading={loading}
        error={error}
        loadingMessage={`Buscando productos para "${query}"...`}
      />
    </div>
  );
};

export default SearchResultsPage;

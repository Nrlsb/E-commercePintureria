// src/pages/SearchResultsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js'; // 1. Importamos el store

const SearchResultsPage = () => {
  // 2. Obtenemos los productos y el término de búsqueda desde el store
  const products = useProductStore(state => state.products);
  const query = useProductStore(state => state.searchQuery);
  
  // 3. Filtramos los productos basados en el query del store
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.brand.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Resultados para: <span className="text-blue-600">"{query}"</span></h1>
      <p className="text-gray-600 mb-8">{filteredProducts.length} productos encontrados.</p>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            // 4. Ya no pasamos onAddToCart como prop
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No se encontraron resultados</h2>
          <Link to="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Volver a la tienda</Link>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;

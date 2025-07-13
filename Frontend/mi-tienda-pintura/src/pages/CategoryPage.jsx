// src/pages/CategoryPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import ProductFilters from '../components/ProductFilters.jsx'; // 1. Importamos el nuevo componente
import { useProductStore } from '../stores/useProductStore.js';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const { products, loading, error, fetchProducts } = useProductStore();

  // 2. Usamos useEffect para llamar a fetchProducts cuando la categoría cambie
  useEffect(() => {
    fetchProducts(categoryName);
  }, [categoryName, fetchProducts]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Categoría: <span className="text-blue-600">{categoryName}</span></h1>
      
      {/* 3. Añadimos el componente de filtros */}
      <ProductFilters category={categoryName} />

      {loading && <div className="text-center p-10">Cargando productos...</div>}
      {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}
      
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center p-10 bg-white rounded-lg shadow-md mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No hay productos que coincidan con tus filtros</h2>
          <Link to="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Volver al inicio</Link>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;

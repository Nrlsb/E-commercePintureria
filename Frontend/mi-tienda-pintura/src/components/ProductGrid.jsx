// src/components/ProductGrid.jsx
import React from 'react';
import ProductCard from './ProductCard.jsx';
import ProductCardSkeleton from './ProductCardSkeleton.jsx';

/**
 * Componente para renderizar una cuadrícula de productos.
 * Maneja los estados de carga, error y cuando no hay productos.
 */
const ProductGrid = ({ products, loading, error, loadingMessage = "Cargando productos...", errorMessage = "Error al cargar los productos." }) => {
  // Si está cargando, muestra la cuadrícula de skeletons
  if (loading) {
    return (
      <div>
        <p className="text-center text-gray-500 mb-6">{loadingMessage}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Renderiza 8 skeletons como placeholders */}
          {[...Array(8)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Si hay un error, muestra un mensaje de error
  if (error) {
    return <div className="text-center p-10 text-red-500">{errorMessage}: {error}</div>;
  }

  // Si no hay productos (y no está cargando), muestra un mensaje informativo
  if (products.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-lg shadow-md mt-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">No se encontraron productos</h2>
        <p className="text-gray-600">Intenta ajustar tu búsqueda o filtros.</p>
      </div>
    );
  }

  // Si todo está bien, renderiza los productos reales
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;

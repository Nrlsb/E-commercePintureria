// src/components/ProductCardSkeleton.jsx
import React from 'react';

/**
 * Componente de esqueleto para la tarjeta de producto.
 * Muestra una versión placeholder con una animación de pulso mientras se cargan los datos.
 */
const ProductCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md flex flex-col overflow-hidden">
      {/* Placeholder para la imagen del producto */}
      <div className="relative w-full h-56 bg-gray-200 animate-pulse"></div>
      <div className="p-4 flex flex-col flex-grow">
        {/* Placeholder para la marca */}
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
        {/* Placeholder para el nombre del producto */}
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4 animate-pulse"></div>
        {/* Placeholder para la calificación por estrellas */}
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
        <div className="mt-auto">
          {/* Placeholder para el precio */}
          <div className="flex items-baseline mb-4">
            <div className="h-8 bg-gray-300 rounded w-1/3 animate-pulse"></div>
          </div>
          {/* Placeholder para el botón de agregar al carrito */}
          <div className="h-10 bg-gray-300 rounded-lg w-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

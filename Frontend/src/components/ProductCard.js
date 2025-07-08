// src/components/ProductCard.js
import React from 'react';

// Componente que representa una tarjeta de producto individual.
const ProductCard = ({ product, onAddToCart, onProductClick }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden group">
      {product.tag && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">{product.tag}</div>
      )}
      <div 
        className="relative w-full h-56 cursor-pointer"
        onClick={() => onProductClick(product)}
      >
        <img src={product.imageUrl} alt={`Imagen de ${product.name}`} className="w-full h-full object-cover"/>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-1">{product.brand}</h3>
        <h2 
            className="text-gray-900 text-base font-medium mb-2 h-12 cursor-pointer group-hover:text-blue-600 transition-colors"
            onClick={() => onProductClick(product)}
        >
            {product.name}
        </h2>
        
        <div className="mt-auto">
            <div className="flex items-center mb-4">
                <p className="text-2xl font-bold text-gray-900">${new Intl.NumberFormat('es-AR').format(product.price)}</p>
                {product.oldPrice && (
                    <p className="text-sm text-gray-500 line-through ml-2">${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>
                )}
            </div>
            <button 
                onClick={() => onAddToCart(product)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
            >
                Agregar al Carrito
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

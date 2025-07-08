// src/components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Importar Link

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden group">
      {/* ... */}
      <Link to={`/product/${product.id}`} className="relative w-full h-56 cursor-pointer">
        <img src={product.imageUrl} alt={`Imagen de ${product.name}`} className="w-full h-full object-cover"/>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-1">{product.brand}</h3>
        <Link to={`/product/${product.id}`}>
            <h2 className="text-gray-900 text-base font-medium mb-2 h-12 cursor-pointer group-hover:text-blue-600 transition-colors">
                {product.name}
            </h2>
        </Link>
        {/* ... resto de la tarjeta ... */}
        <button 
            onClick={() => onAddToCart(product)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
        >
            Agregar al Carrito
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

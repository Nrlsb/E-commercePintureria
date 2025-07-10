// src/components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';
import StarRating from './StarRating.jsx'; // Importar el nuevo componente

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
      <Link to={`/product/${product.id}`} className="relative w-full h-56 cursor-pointer block">
        <img src={product.imageUrl} alt={`Imagen de ${product.name}`} className="w-full h-full object-cover"/>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-1">{product.brand}</h3>
        <Link to={`/product/${product.id}`} className="h-12 mb-2">
            <h2 className="text-gray-800 text-base font-semibold leading-tight cursor-pointer group-hover:text-[#0F3460] transition-colors">
                {product.name}
            </h2>
        </Link>
        
        {/* CAMBIO: Añadir el componente de calificación por estrellas */}
        <div className="mb-4">
          <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline mb-4">
            <p className="text-2xl font-bold text-[#0F3460]">${new Intl.NumberFormat('es-AR').format(product.price)}</p>
            {product.oldPrice && (
              <p className="text-md text-gray-400 line-through ml-2">${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>
            )}
          </div>
          <button 
              onClick={() => onAddToCart(product)}
              className="w-full flex items-center justify-center bg-[#0F3460] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-[#1a4a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3460] transition-colors duration-300"
          >
              <Icon path={ICONS.shoppingCart} className="w-5 h-5 mr-2" />
              Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

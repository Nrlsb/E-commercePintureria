// src/components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';
import StarRating from './StarRating.jsx';
import { useCartStore } from '../stores/useCartStore.js';
import { useNotificationStore } from '../stores/useNotificationStore.js';

// Ya no necesitamos la URL del API para las imágenes
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProductCard = React.memo(({ product }) => {
  const addToCart = useCartStore(state => state.addToCart);
  const showNotification = useNotificationStore(state => state.showNotification);

  // --- MODIFICADO: La lógica de la URL se simplifica ---
  // Las URLs de GCS son absolutas, por lo que no necesitamos construirlas.
  // Solo necesitamos un placeholder en caso de que la URL sea nula.
  const imageUrl = product.imageUrl || `https://placehold.co/300x224/cccccc/ffffff?text=${encodeURIComponent(product.name)}`;

  const handleAddToCart = () => {
    addToCart(product);
    showNotification(`${product.name} ha sido agregado al carrito.`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
      <Link to={`/product/${product.id}`} className="relative w-full h-56 cursor-pointer block bg-white p-2">
        <img 
          src={imageUrl}
          alt={`Imagen de ${product.name}`} 
          className="w-full h-full object-contain"
          loading="lazy"
          width="300"
          height="224"
          onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/300x224/cccccc/ffffff?text=Imagen+no+disponible`; }}
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-1">{product.brand}</h3>
        <Link to={`/product/${product.id}`} className="h-12 mb-2">
            <h2 className="text-gray-800 text-base font-semibold leading-tight cursor-pointer group-hover:text-[#0F3460] transition-colors">
                {product.name}
            </h2>
        </Link>
        
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
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center bg-[#0F3460] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-[#1a4a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3460] transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
              <Icon path={ICONS.shoppingCart} className="w-5 h-5 mr-2" />
              {product.stock > 0 ? 'Agregar al Carrito' : 'Sin stock'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;

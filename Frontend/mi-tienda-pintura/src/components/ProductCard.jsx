// src/components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';
import StarRating from './StarRating.jsx';
import { useCartStore } from '../stores/useCartStore.js';
import { useNotificationStore } from '../stores/useNotificationStore.js';
import { useWishlistStore } from '../stores/useWishlistStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useProductStore } from '../stores/useProductStore.js'; // 1. Importar el store de productos

const ProductCard = React.memo(({ product }) => {
  const addToCart = useCartStore(state => state.addToCart);
  const showNotification = useNotificationStore(state => state.showNotification);
  const openQuickView = useProductStore(state => state.openQuickView); // 2. Obtener la acción para abrir el modal
  
  const { wishlistProductIds, toggleWishlistItem } = useWishlistStore();
  const { user, token } = useAuthStore();
  const isWishlisted = wishlistProductIds.has(product.id);

  const imageUrls = product.imageUrl;
  let src, srcSet;

  if (imageUrls && typeof imageUrls === 'object') {
    src = imageUrls.medium || imageUrls.small;
    srcSet = `${imageUrls.small} 400w, ${imageUrls.medium} 800w, ${imageUrls.large} 1200w`;
  } else {
    src = imageUrls || `https://placehold.co/300x224/cccccc/ffffff?text=${encodeURIComponent(product.name)}`;
    srcSet = null;
  }

  const handleAddToCart = () => {
    addToCart(product);
    showNotification(`${product.name} ha sido agregado al carrito.`);
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!token) {
        showNotification('Debes iniciar sesión para usar la lista de deseos.', 'error');
        return;
    }
    toggleWishlistItem(product, token);
  };
  
  // 3. Handler para el botón de vista rápida
  const handleQuickViewClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    openQuickView(product);
  };

  const cardVariants = {
    rest: { y: 0, scale: 1 },
    hover: { y: -5, scale: 1.03 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white border border-gray-200 rounded-xl shadow-md flex flex-col overflow-hidden group relative"
    >
      {user && (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 p-2 bg-white/70 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-colors"
            aria-label="Añadir a la lista de deseos"
        >
            <Icon path={ICONS.heart} className={`w-6 h-6 ${isWishlisted ? 'text-red-500 fill-current' : 'fill-transparent stroke-current stroke-2'}`} />
        </motion.button>
      )}

      <Link to={`/product/${product.id}`} className="relative w-full h-56 cursor-pointer block bg-white p-2">
        <img 
          src={src}
          srcSet={srcSet}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 23vw"
          alt={`Imagen de ${product.name}`} 
          className="w-full h-full object-contain"
          loading="lazy"
          width="300"
          height="224"
          onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/300x224/cccccc/ffffff?text=Imagen+no+disponible`; }}
        />
        {/* 4. Botón de Vista Rápida que aparece al hacer hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleQuickViewClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
                Vista Rápida
            </motion.button>
        </div>
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
          <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center bg-[#0F3460] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-[#1a4a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3460] transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
              <Icon path={ICONS.shoppingCart} className="w-5 h-5 mr-2" />
              {product.stock > 0 ? 'Agregar al Carrito' : 'Sin stock'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;

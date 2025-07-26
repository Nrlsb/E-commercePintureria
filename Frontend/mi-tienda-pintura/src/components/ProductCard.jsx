// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';
import StarRating from './StarRating.jsx';
import Spinner from './Spinner.jsx';
import { useCartStore } from '../stores/useCartStore.js';
import { useNotificationStore } from '../stores/useNotificationStore.js';
import { useWishlistStore } from '../stores/useWishlistStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useProductStore } from '../stores/useProductStore.js';

const ProductCard = React.memo(({ product }) => {
  const addToCart = useCartStore(state => state.addToCart);
  const showNotification = useNotificationStore(state => state.showNotification);
  const openQuickView = useProductStore(state => state.openQuickView);
  
  const { wishlistProductIds, toggleWishlistItem } = useWishlistStore();
  const { user, token } = useAuthStore();
  const isWishlisted = wishlistProductIds.has(product.id);

  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  let src, srcSet;
  let parsedImageUrls = product.imageUrl; // Inicializamos con el valor crudo

  // Intentamos parsear la cadena JSON si parece ser una
  if (typeof parsedImageUrls === 'string' && parsedImageUrls.startsWith('{')) {
    try {
      parsedImageUrls = JSON.parse(parsedImageUrls);
    } catch (e) {
      console.error("Error parsing product.imageUrl JSON string:", e);
      parsedImageUrls = null; // Si falla el parseo, tratamos como null
    }
  }

  // Ahora, manejamos parsedImageUrls que puede ser un objeto, una URL string o null
  if (parsedImageUrls && typeof parsedImageUrls === 'object') {
    src = parsedImageUrls.medium || parsedImageUrls.small;
    srcSet = '';
    if (parsedImageUrls.small) srcSet += `${parsedImageUrls.small} 400w, `;
    if (parsedImageUrls.medium) srcSet += `${parsedImageUrls.medium} 800w, `;
    if (parsedImageUrls.large) srcSet += `${parsedImageUrls.large} 1200w`;
    srcSet = srcSet.trim().replace(/,$/, ''); // Eliminar la última coma si existe
  } else {
    // Si parsedImageUrls es una URL string directa o null/undefined
    src = parsedImageUrls || `https://placehold.co/300x224/cccccc/ffffff?text=${encodeURIComponent(product.name || 'Producto')}`;
    srcSet = null;
  }

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product);
      showNotification(`${product.name} ha sido agregado al carrito.`);
    } catch (err) {
      showNotification('Error al agregar al carrito.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!token) {
        showNotification('Debes iniciar sesión para usar la lista de deseos.', 'error');
        return;
    }
    setTogglingWishlist(true);
    try {
      await toggleWishlistItem(product, token);
    } catch (err) {
      showNotification('Error al actualizar la lista de deseos.', 'error');
    } finally {
      setTogglingWishlist(false);
    }
  };
  
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
            className="absolute top-3 right-3 z-10 p-2 bg-white/70 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-colors flex items-center justify-center"
            aria-label={isWishlisted ? `Quitar ${product.name} de la lista de deseos` : `Añadir ${product.name} a la lista de deseos`}
            title={isWishlisted ? `Quitar ${product.name} de la lista de deseos` : `Añadir ${product.name} a la lista de deseos`}
            disabled={togglingWishlist}
        >
            {togglingWishlist ? (
              <Spinner className="w-5 h-5 text-gray-600" />
            ) : (
              <Icon path={ICONS.heart} className={`w-6 h-6 ${isWishlisted ? 'text-red-500 fill-current' : 'fill-transparent stroke-current stroke-2'}`} />
            )}
        </motion.button>
      )}

      <Link 
        to={`/product/${product.id}`} 
        className="relative w-full h-56 cursor-pointer block bg-white p-2"
        aria-label={`Ver detalles de ${product.name}`}
      >
        <img 
          src={src}
          srcSet={srcSet}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 23vw"
          alt={`Imagen de ${product.name || 'producto'}, marca ${product.brand || 'desconocida'}`} // Fallback para product.name
          className="w-full h-full object-contain"
          loading="lazy"
          width="300"
          height="224"
          onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/300x224/cccccc/ffffff?text=Imagen+no+disponible`; }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleQuickViewClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-800 font-bold py-2 px-4 rounded-lg"
                aria-label={`Vista rápida de ${product.name}`}
                title={`Vista rápida de ${product.name}`}
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
            <p className="text-2xl font-bold text-[#0F3460]" aria-label={`Precio: ${product.price} pesos argentinos`}>${new Intl.NumberFormat('es-AR').format(product.price)}</p>
            {product.oldPrice && (
              <p className="text-md text-gray-400 line-through ml-2" aria-label={`Precio anterior: ${product.oldPrice} pesos argentinos`}>${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>
            )}
          </div>
          <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
              className="w-full flex items-center justify-center bg-[#0F3460] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-[#1a4a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3460] transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label={product.stock > 0 ? `Agregar ${product.name} al carrito` : `Sin stock de ${product.name}`}
          >
              {addingToCart ? (
                <Spinner className="w-5 h-5 text-white" />
              ) : (
                <>
                  <Icon path={ICONS.shoppingCart} className="w-5 h-5 mr-2" />
                  {product.stock > 0 ? 'Agregar al Carrito' : 'Sin stock'}
                </>
              )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;

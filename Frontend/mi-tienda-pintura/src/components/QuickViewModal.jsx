// src/components/QuickViewModal.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import StarRating from './StarRating';
import Icon from './Icon';

const QuickViewModal = ({ product, onClose }) => {
    const [quantity, setQuantity] = useState(1);
    const addToCart = useCartStore(state => state.addToCart);
    const showNotification = useNotificationStore(state => state.showNotification);

    if (!product) return null;

    const handleQuantityChange = (amount) => {
        setQuantity(prev => {
            const newQuantity = prev + amount;
            if (newQuantity < 1) return 1;
            if (product && newQuantity > product.stock) return product.stock;
            return newQuantity;
        });
    };

    const handleAddToCartClick = () => {
        addToCart(product, quantity);
        showNotification(`${product.name} ha sido agregado al carrito.`);
        onClose();
    };

    const imageUrls = product.imageUrl;
    const src = imageUrls?.medium || imageUrls || `https://placehold.co/400x400/cccccc/ffffff?text=${encodeURIComponent(product.name)}`;

    const backdropVariants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    const modalVariants = {
        hidden: { y: "-50px", opacity: 0, scale: 0.95 },
        visible: { y: "0", opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
        exit: { y: "50px", opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
        >
            <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col md:flex-row max-h-[90vh] relative"
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10">
                     <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" className="w-8 h-8" />
                </button>

                {/* Sección de Imagen */}
                <div className="w-full md:w-1/2 p-4 flex items-center justify-center">
                    <img src={src} alt={`Imagen de ${product.name}`} className="max-w-full h-auto max-h-[400px] object-contain" />
                </div>

                {/* Sección de Detalles */}
                <div className="w-full md:w-1/2 p-6 flex flex-col">
                    <h3 className="text-gray-500 text-sm uppercase tracking-widest mb-1">{product.brand}</h3>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h2>
                    
                    <div className="mb-4">
                        <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
                    </div>

                    <div className="flex items-baseline mb-5">
                        <p className="text-3xl font-bold text-[#0F3460]">${new Intl.NumberFormat('es-AR').format(product.price)}</p>
                        {product.oldPrice && (<p className="text-lg text-gray-400 line-through ml-3">${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>)}
                    </div>

                    {/* FIX: Add a conditional check for product.description to prevent substring error */}
                    <p className="text-gray-600 text-sm mb-6 flex-grow overflow-y-auto">
                        {product.description 
                            ? `${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}`
                            : 'No hay descripción disponible para este producto.'
                        }
                    </p>

                    <div className="flex items-center space-x-4 mb-6">
                        <p className="font-semibold">Cantidad:</p>
                        <div className="flex items-center border border-gray-300 rounded-md">
                            <button onClick={() => handleQuantityChange(-1)} disabled={product.stock === 0} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-l-md transition-colors disabled:opacity-50">-</button>
                            <span className="px-4 py-1 text-lg">{product.stock > 0 ? quantity : 0}</span>
                            <button onClick={() => handleQuantityChange(1)} disabled={product.stock === 0} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-r-md transition-colors disabled:opacity-50">+</button>
                        </div>
                        {product.stock > 0 && <span className="text-sm text-gray-500">({product.stock} disponibles)</span>}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleAddToCartClick}
                        disabled={product.stock === 0}
                        className="w-full bg-[#0F3460] text-white py-3 px-6 rounded-lg font-bold text-md hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400"
                    >
                        {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </motion.button>
                    
                    <Link to={`/product/${product.id}`} onClick={onClose} className="block text-center mt-4 text-sm text-[#0F3460] hover:underline">
                        Ver detalles completos del producto
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default QuickViewModal;

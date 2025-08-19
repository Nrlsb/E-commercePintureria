// src/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import AnimatedNumber from '../components/AnimatedNumber';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

// --- NUEVO COMPONENTE PARA RECOMENDACIONES ---
const RecommendedProducts = () => {
  const { recommendations, recommendationsLoading, fetchRecommendations, cart } = useCartStore(state => ({
    recommendations: state.recommendations,
    recommendationsLoading: state.recommendationsLoading,
    fetchRecommendations: state.fetchRecommendations,
    cart: state.cart
  }));

  useEffect(() => {
    // Solo busca recomendaciones si hay algo en el carrito
    if (cart.length > 0) {
      fetchRecommendations();
    }
  }, [cart, fetchRecommendations]); // Se ejecuta cuando el carrito cambia

  // No renderizar nada si no está cargando y no hay recomendaciones
  if (!recommendationsLoading && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="lg:col-span-3 mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Productos que podrías necesitar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendationsLoading ? (
          [...Array(4)].map((_, index) => <ProductCardSkeleton key={index} />)
        ) : (
          recommendations.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};


const CartPage = () => {
  const { cart, updateQuantity, removeItem, shippingCost, postalCode, calculateShipping, appliedCoupon, discountAmount, applyCoupon, removeCoupon, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [localPostalCode, setLocalPostalCode] = useState(postalCode);
  const [couponCode, setCouponCode] = useState('');
  const [loadingShipping, setLoadingShipping] = useState(false);
  
  const [stockErrorId, setStockErrorId] = useState(null);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartTotal = (cartSubtotal - discountAmount) + shippingCost;

  const handleShippingCalculation = async () => {
    if (!localPostalCode || !/^\d{4}$/.test(localPostalCode)) {
      showNotification('Por favor, ingresa un código postal válido de 4 dígitos.', 'error');
      return;
    }
    setLoadingShipping(true);
    await calculateShipping(localPostalCode);
    setLoadingShipping(false);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCoupon(couponCode, token);
    }
  };

  const handleQuantityChange = (item, amount) => {
    const newQuantity = item.quantity + amount;
    if (newQuantity > item.stock) {
      showNotification(`No puedes añadir más. Stock máximo: ${item.stock}`, 'error');
      setStockErrorId(item.id);
      setTimeout(() => setStockErrorId(null), 500);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleClearCartConfirm = () => {
    clearCart();
    setIsClearCartModalOpen(false);
    showNotification('Tu carrito ha sido vaciado.', 'success');
  };

  const getCartItemImageUrl = (item) => {
    if (item.imageUrl && typeof item.imageUrl === 'object') {
      return item.imageUrl.small || item.imageUrl.medium;
    }
    return item.imageUrl || `https://placehold.co/100x100/cccccc/ffffff?text=Img`;
  };

  if (cart.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <div className="p-10 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 mb-6">Parece que todavía no has añadido ningún producto. ¡Explora nuestra tienda!</p>
          <Link to="/" className="inline-block bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a] transition-colors">
            &larr; Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfirmationModal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={handleClearCartConfirm}
        title="Vaciar Carrito"
        message="¿Estás seguro de que quieres eliminar todos los productos de tu carrito?"
        confirmText="Sí, Vaciar"
        iconPath="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        iconColor="text-red-500"
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mi Carrito</h1>
        <button 
          onClick={() => setIsClearCartModalOpen(true)} 
          className="text-sm text-gray-500 hover:text-red-600 hover:underline"
        >
          Vaciar Carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                  className="flex flex-col sm:flex-row items-center justify-between border-b pb-6 last:border-b-0"
                >
                  <div className="flex items-center mb-4 sm:mb-0">
                    <img src={getCartItemImageUrl(item)} alt={item.name} className="w-24 h-24 object-cover rounded-md mr-4" />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                      <p className="text-gray-500">{item.brand}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      animate={{ x: stockErrorId === item.id ? [-5, 5, -5, 5, 0] : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center border border-gray-300 rounded-md"
                    >
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-l-md transition-colors">-</button>
                      <span className="px-4 py-1 text-lg">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item, 1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-r-md transition-colors">+</button>
                    </motion.div>
                    <p className="font-bold text-lg w-28 text-right">$<AnimatedNumber value={item.price * item.quantity} /></p>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
                <h2 className="text-2xl font-bold border-b pb-4 mb-4">Resumen de Compra</h2>
                
                <div className="space-y-2 text-lg mb-4">
                  <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>$<AnimatedNumber value={cartSubtotal} /></span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({appliedCoupon.code})</span>
                      <span>- $<AnimatedNumber value={discountAmount} /></span>
                    </div>
                  )}
                  <div className="flex justify-between">
                      <span>Envío</span>
                      <span>{shippingCost > 0 ? `$${new Intl.NumberFormat('es-AR').format(shippingCost)}` : 'A calcular'}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">Calcular Envío</h3>
                  <div className="flex items-center space-x-2">
                    <input type="text" value={localPostalCode} onChange={(e) => setLocalPostalCode(e.target.value)} placeholder="Cód. Postal" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
                    <button 
                      onClick={handleShippingCalculation} 
                      disabled={loadingShipping}
                      className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center w-24"
                    >
                      {loadingShipping ? <Spinner className="w-5 h-5 text-gray-700" /> : 'OK'}
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">Cupón de Descuento</h3>
                  {appliedCoupon ? (
                    <div className="flex justify-between items-center bg-green-50 p-2 rounded-md">
                      <p className="text-green-700 font-semibold">Cupón "{appliedCoupon.code}" aplicado.</p>
                      <button onClick={removeCoupon} className="text-red-500 font-bold text-xl">&times;</button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Ingresa tu cupón" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
                      <button onClick={handleApplyCoupon} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Aplicar</button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4">
                    <span>Total</span>
                    <span>$<AnimatedNumber value={cartTotal} /></span>
                </div>

                <Link to="/checkout" className="block text-center w-full mt-6 bg-[#10B981] text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors">
                    Finalizar Compra
                </Link>
                 <Link to="/" className="block text-center w-full mt-4 text-[#0F3460] hover:underline font-medium">
                    Seguir comprando
                </Link>
            </div>
        </div>
        
        {/* --- NUEVA SECCIÓN DE RECOMENDACIONES --- */}
        <RecommendedProducts />
      </div>
    </div>
  );
};

export default CartPage;

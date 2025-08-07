// src/pages/OrderSuccessPage.jsx
import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import Icon from '../components/Icon';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const clearCart = useCartStore(state => state.clearCart);

  // --- CORRECCIÓN ---
  // Se añade un useEffect que se ejecuta una sola vez cuando el componente se monta.
  // Su única responsabilidad es limpiar el carrito de compras.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-lg w-full">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <Icon path="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Gracias por tu compra!</h1>
        <p className="text-gray-600 mb-6">
          Tu pedido <strong className="text-gray-900">#{orderId}</strong> ha sido realizado con éxito. En breve recibirás un correo electrónico con todos los detalles.
        </p>
        <div className="flex justify-center space-x-4 mt-8">
          <Link to="/" className="bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a] transition-colors">
            Volver a la tienda
          </Link>
          <Link to="/my-orders" className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
            Ver mis compras
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

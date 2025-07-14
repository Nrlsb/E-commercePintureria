// src/pages/OrderSuccessPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore'; // 1. Importamos el store del carrito

const OrderSuccessPage = () => {
  // 2. Obtenemos la acción para limpiar el carrito
  const clearCart = useCartStore(state => state.clearCart);

  // 3. Usamos useEffect para limpiar el carrito una sola vez cuando el componente se monta
  useEffect(() => {
    clearCart();
  }, [clearCart]); // El array de dependencias asegura que se ejecute solo una vez

  return (
    <div className="text-center p-10 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-green-500 mb-4">¡Gracias por tu compra!</h1>
      <p className="text-gray-600 mb-6">Tu pedido ha sido realizado con éxito. Recibirás un correo con los detalles.</p>
      <Link to="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
        Volver a la tienda
      </Link>
    </div>
  );
};

export default OrderSuccessPage;

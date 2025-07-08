// src/pages/OrderSuccessPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const OrderSuccessPage = () => {
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

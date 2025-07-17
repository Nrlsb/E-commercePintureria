// src/pages/OrderPendingPage.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { ICONS } from '../data/icons';

const OrderPendingPage = () => {
  const { orderId } = useParams();

  return (
    <div className="text-center p-10 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
        <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" className="h-6 w-6 text-yellow-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu orden está pendiente de pago</h1>
      <p className="text-gray-600 mb-2">
        Hemos recibido tu pedido <strong className="text-gray-900">#{orderId}</strong> y estamos esperando la confirmación de tu pago.
      </p>
      <p className="text-gray-600 mb-6">
        Recibirás un correo electrónico con las instrucciones para realizar la transferencia. Tu stock está reservado por 48 horas.
      </p>
      <div className="flex justify-center space-x-4">
        <Link to="/my-orders" className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
          Ver mis compras
        </Link>
        <Link to="/" className="bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a] transition-colors">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
};

export default OrderPendingPage;

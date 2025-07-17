// src/pages/OrderPendingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import CopyButton from '../components/CopyButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const OrderPendingPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('No se pudo cargar la orden.');
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, token]);

  if (loading) return <div className="flex-grow flex items-center justify-center"><Spinner className="w-12 h-12 text-[#0F3460]" /></div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center p-10 bg-white rounded-lg shadow-md">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" className="h-6 w-6 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu orden está pendiente de pago</h1>
        <p className="text-gray-600 mb-6">
          Hemos recibido tu pedido <strong className="text-gray-900">#{order.id}</strong> y estamos esperando la confirmación de tu pago.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Instrucciones de Pago</h3>
          <div className="bg-gray-50 p-4 rounded-md space-y-2 text-gray-800">
            <p><strong>Banco:</strong> Banco de la Plaza</p>
            <p><strong>Titular:</strong> Pinturerías Mercurio S.A.</p>
            <p><strong>CUIT:</strong> 30-12345678-9</p>
            <p className="flex items-center"><strong>CBU/CVU:</strong> 0001112223334445556667 <CopyButton textToCopy="0001112223334445556667" /></p>
            <p className="flex items-center"><strong>Alias:</strong> PINTU.MERCURIO.MP <CopyButton textToCopy="PINTU.MERCURIO.MP" /></p>
            <p className="font-bold text-lg mt-2">Monto a transferir: ${new Intl.NumberFormat('es-AR').format(order.total_amount)}</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">El stock de tus productos será reservado por 48 horas.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Resumen de tu Orden</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md mr-4" />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
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

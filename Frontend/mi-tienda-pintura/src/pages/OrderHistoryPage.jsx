// src/pages/OrderHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const OrderHistoryPage = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('No se pudo cargar el historial de compras.');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token]);

  if (loading) {
    return <div className="text-center p-10">Cargando historial...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Historial de Compras</h1>
      {orders.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Aún no has realizado ninguna compra.</h2>
            <Link to="/" className="bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a]">
                Explorar productos
            </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <h2 className="font-bold text-lg">Orden #{order.id}</h2>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(order.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-xl text-[#0F3460]">${new Intl.NumberFormat('es-AR').format(order.total_amount)}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                    </span>
                </div>
              </div>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md mr-4" />
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${new Intl.NumberFormat('es-AR').format(item.price)} c/u</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;

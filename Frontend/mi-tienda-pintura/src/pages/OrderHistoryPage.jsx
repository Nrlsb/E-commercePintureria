// src/pages/OrderHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import Icon from '../components/Icon';
import { StatusBadge } from './AdminOrdersPage'; // Reutilizamos el badge de la página de admin
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const OrderHistoryPage = () => {
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrders = useCallback(async () => {
    // No es necesario establecer loading a true aquí si ya se hizo en el useEffect inicial
    try {
      const response = await fetchWithCsrf(`${API_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders]);
  
  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    
    setIsCancelling(true);
    try {
        const response = await fetchWithCsrf(`${API_URL}/api/orders/${orderToCancel.id}/user-cancel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error al cancelar la orden.');
        }

        showNotification('Orden cancelada con éxito.', 'success');
        fetchOrders(); // Recarga las órdenes para mostrar el estado actualizado
    } catch (err) {
        showNotification(err.message, 'error');
    } finally {
        setIsCancelling(false);
        setIsCancelModalOpen(false);
        setOrderToCancel(null);
    }
  };
  
  const isCancellable = (order) => {
    if (!['approved', 'shipped'].includes(order.status)) {
        return false;
    }
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const getCartItemImageUrl = (item) => {
    if (item.imageUrl && typeof item.imageUrl === 'object' && item.imageUrl.small) {
      return item.imageUrl.small;
    }
    return item.imageUrl || `https://placehold.co/100x100/cccccc/ffffff?text=Img`;
  };

  if (loading) {
    return <div className="text-center p-10"><Spinner className="w-12 h-12 text-[#0F3460] mx-auto" /></div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancelar Compra"
        message={`¿Estás seguro de que quieres cancelar la orden #${orderToCancel?.id}? Esta acción es irreversible y se procesará un reembolso.`}
        confirmText={isCancelling ? 'Cancelando...' : 'Sí, Cancelar'}
        isConfirmDisabled={isCancelling}
        iconPath="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
        iconColor="text-red-500"
      />

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
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md transition-shadow hover:shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-4 mb-4 gap-4">
                <div>
                  <h2 className="font-bold text-lg text-gray-800">Orden #{order.id}</h2>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(order.created_at).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-bold text-xl text-[#0F3460]">${new Intl.NumberFormat('es-AR').format(order.total_amount)}</p>
                    </div>
                </div>
              </div>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <img src={getCartItemImageUrl(item)} alt={item.name} className="w-16 h-16 rounded-md mr-4" />
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity} &times; ${new Intl.NumberFormat('es-AR').format(item.price)} c/u</p>
                    </div>
                    <p className="font-medium">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4 flex justify-end items-center gap-4">
                {order.tracking_number && ['shipped', 'delivered'].includes(order.status) && (
                    <Link
                        to={`/track/${order.tracking_number}`}
                        className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 text-sm"
                    >
                        <Icon path="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" className="w-4 h-4" />
                        <span>Seguir Envío</span>
                    </Link>
                )}
                {isCancellable(order) && (
                    <button 
                        onClick={() => handleCancelClick(order)}
                        className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 text-sm"
                    >
                        <Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" className="w-4 h-4" />
                        <span>Cancelar Compra</span>
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;

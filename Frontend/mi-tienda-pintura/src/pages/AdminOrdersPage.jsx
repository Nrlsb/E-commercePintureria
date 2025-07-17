// src/pages/AdminOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders/admin`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 403) {
        showNotification("Acceso denegado. Se requiere rol de administrador.", "error");
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes.');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate, showNotification]);

  useEffect(() => {
    if (token) {
        fetchOrders();
    }
  }, [token, fetchOrders]);

  const handleAction = async (action, orderId) => {
    const confirmMessages = {
      cancel: `¿Estás seguro de que quieres cancelar la orden #${orderId}? Esta acción es irreversible.`,
      confirm: `¿Confirmas que has recibido el pago para la orden #${orderId}?`
    };
    const urls = {
      cancel: `${API_URL}/api/orders/${orderId}/cancel`,
      confirm: `${API_URL}/api/orders/${orderId}/confirm-payment`
    };

    if (window.confirm(confirmMessages[action])) {
      try {
        const response = await fetch(urls[action], {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al procesar la acción.');
        
        showNotification(data.message, 'success');
        fetchOrders(); // Recargar las órdenes para ver el estado actualizado
      } catch (err) {
        showNotification(`Error: ${err.message}`, 'error');
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending_transfer: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const statusText = status.replace('_', ' ');
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText}
      </span>
    );
  };

  if (loading) return <div className="text-center p-10">Cargando órdenes...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Órdenes</h1>
        <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-4">ID Orden</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">#{order.id}</td>
                <td className="p-4">{order.user_email}</td>
                <td className="p-4">{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                <td className="p-4">${new Intl.NumberFormat('es-AR').format(order.total_amount)}</td>
                <td className="p-4"><StatusBadge status={order.status} /></td>
                <td className="p-4 text-center space-x-2">
                  {order.status === 'approved' && (
                    <button onClick={() => handleAction('cancel', order.id)} className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600">
                      Cancelar
                    </button>
                  )}
                  {order.status === 'pending_transfer' && (
                    <button onClick={() => handleAction('confirm', order.id)} className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-green-600">
                      Confirmar Pago
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;

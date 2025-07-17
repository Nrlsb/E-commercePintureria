// src/pages/AdminOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import OrderDetailModal from '../components/OrderDetailModal'; // <-- NUEVO
import Spinner from '../components/Spinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // Para el modal
  const [filters, setFilters] = useState({ status: '', search: '' }); // Para filtros y búsqueda
  
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    try {
      const response = await fetch(`${API_URL}/api/orders/admin?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 403) {
        showNotification("Acceso denegado.", "error");
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
  }, [token, navigate, showNotification, filters]);

  useEffect(() => {
    if (token) {
        fetchOrders();
    }
  }, [token, fetchOrders]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRowClick = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo cargar el detalle de la orden.');
      const data = await response.json();
      setSelectedOrder(data);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleAction = async (action, orderId) => {
    // ... (la lógica de handleAction se mantiene igual)
  };

  const StatusBadge = ({ status }) => {
    // ... (la lógica de StatusBadge se mantiene igual)
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Órdenes</h1>
        <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
      </div>

      {/* --- NUEVA SECCIÓN DE FILTROS --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          name="search"
          placeholder="Buscar por ID o Email..."
          value={filters.search}
          onChange={handleFilterChange}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
        >
          <option value="">Todos los estados</option>
          <option value="approved">Aprobado</option>
          <option value="pending_transfer">Pendiente (Transferencia)</option>
          <option value="pending">Pendiente (Otro)</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-10"><Spinner className="w-10 h-10 text-[#0F3460]" /></div>
        ) : error ? (
          <div className="text-center p-10 text-red-500">Error: {error}</div>
        ) : (
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
                <tr key={order.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(order.id)}>
                  <td className="p-4 font-medium">#{order.id}</td>
                  <td className="p-4">{order.user_email}</td>
                  <td className="p-4">{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="p-4">${new Intl.NumberFormat('es-AR').format(order.total_amount)}</td>
                  <td className="p-4"><StatusBadge status={order.status} /></td>
                  <td className="p-4 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
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
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;

// src/pages/AdminOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import OrderDetailModal from '../components/OrderDetailModal';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import Icon from '../components/Icon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ICONS = {
    cancel: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
    confirm: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L11.12 16.7c-.38.38-1.02.38-1.41-.01z"
};

const StatusBadge = ({ status }) => {
  const styles = {
    approved: 'bg-green-100 text-green-800',
    pending_transfer: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  const statusText = status ? status.replace(/_/g, ' ') : 'Desconocido';
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusText}
    </span>
  );
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  // --- CORRECCIÓN: Se elimina 'filters' de las dependencias de useCallback ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    // Leemos los filtros directamente del estado más reciente al momento de ejecutar.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate, showNotification]); // Eliminamos 'filters' de aquí

  // --- CORRECCIÓN: useEffect separado para reaccionar a los cambios de filtros ---
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, filters, fetchOrders]); // Este effect se ejecuta al inicio y cuando cambian los filtros.

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

  const openConfirmationModal = (action, orderId) => {
    setActionToConfirm({ action, orderId });
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setActionToConfirm(null);
    setIsModalOpen(false);
  };

  const handleActionConfirm = async () => {
    if (!actionToConfirm) return;

    const { action, orderId } = actionToConfirm;
    closeConfirmationModal();

    const urls = {
      cancel: `${API_URL}/api/orders/${orderId}/cancel`,
      confirm: `${API_URL}/api/orders/${orderId}/confirm-payment`
    };

    try {
      const response = await fetch(urls[action], {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al procesar la acción.');
      
      showNotification(data.message, 'success');
      fetchOrders();
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  const modalContent = actionToConfirm?.action === 'cancel' ? {
    title: 'Cancelar Orden',
    message: `¿Estás seguro de que quieres cancelar la orden #${actionToConfirm.orderId}? Esta acción es irreversible y procesará un reembolso si corresponde.`,
    confirmText: 'Sí, Cancelar',
    iconPath: ICONS.cancel,
    iconColor: 'text-red-500'
  } : {
    title: 'Confirmar Pago',
    message: `¿Confirmas que has recibido el pago por transferencia para la orden #${actionToConfirm?.orderId}?`,
    confirmText: 'Sí, Confirmar',
    iconPath: ICONS.confirm,
    iconColor: 'text-green-500'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleActionConfirm}
        title={modalContent.title}
        message={modalContent.message}
        confirmText={modalContent.confirmText}
        iconPath={modalContent.iconPath}
        iconColor={modalContent.iconColor}
      />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Órdenes</h1>
        <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
      </div>

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
                      <button onClick={() => openConfirmationModal('cancel', order.id)} className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600">
                        Cancelar
                      </button>
                    )}
                    {order.status === 'pending_transfer' && (
                      <button onClick={() => openConfirmationModal('confirm', order.id)} className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-green-600">
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

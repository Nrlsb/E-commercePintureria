// src/pages/AdminOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        // --- CAMBIO CLAVE: Manejo de error 403 ---
        if (response.status === 403) {
          alert("Acceso denegado. Por favor, inicia sesión con una cuenta de administrador.");
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
    };
    
    fetchOrders();
  }, [token, navigate]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm(`¿Estás seguro de que quieres cancelar la orden #${orderId}? Esta acción es irreversible.`)) {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al cancelar la orden.');
        
        alert('Orden cancelada con éxito.');
        // Para no volver a llamar a la API, actualizamos el estado localmente
        setOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, status: 'cancelled' } : order
            )
        );
      } catch (err) {
        alert(`Error: ${err.message}`);
        setError(err.message);
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
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
              <th className="p-4">Acciones</th>
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
                <td className="p-4">
                  {order.status === 'approved' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)} 
                      className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600 transition-colors"
                    >
                      Cancelar
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

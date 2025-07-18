// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- Componente para las tarjetas de estadísticas ---
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`rounded-full p-3 ${color}`}>
      <Icon path={icon} className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- Definición de íconos para la página ---
const ICONS = {
    box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 12.78l-7-4V10l7 4.22V18l-7-4v-1.54l7 4zM13 18v-4.22l7-4V10l-7 4zM12 2.22L18.09 6 12 9.78 5.91 6 12 2.22z",
    clipboardList: "M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    orders: "M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.48 10 10 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z",
    upload: "M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" // <-- AÑADIDO
};

const AdminDashboardPage = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, ordersResponse] = await Promise.all([
          fetch(`${API_URL}/api/products?page=1&limit=100`),
          fetch(`${API_URL}/api/orders/admin`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!productsResponse.ok) throw new Error('Error al cargar los productos');
        if (!ordersResponse.ok) throw new Error('Error al cargar las órdenes');

        const productsData = await productsResponse.json();
        const ordersData = await ordersResponse.json();
        
        setProducts(productsData.products);
        setOrders(ordersData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setDeletingId(productId);
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Error al eliminar el producto');
        }
        setProducts(products.filter(p => p.id !== productId));
        showNotification('Producto eliminado con éxito.', 'success');
      } catch (err) {
        showNotification(err.message, 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) return <div className="text-center p-10"><Icon path={ICONS.box} className="w-12 h-12 animate-spin mx-auto text-[#0F3460]" /></div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Link to="/admin/orders" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path={ICONS.orders} className="w-5 h-5" />
                <span>Gestionar Órdenes</span>
            </Link>
            <Link to="/admin/product/new" className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path={ICONS.add} className="w-5 h-5" />
                <span>Crear Producto</span>
            </Link>
            {/* --- BOTÓN AÑADIDO --- */}
            <Link to="/admin/product/bulk-upload" className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path={ICONS.upload} className="w-5 h-5" />
                <span>Carga Masiva</span>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total de Productos" value={products.length} icon={ICONS.box} color="bg-blue-500" />
        <StatCard title="Total de Órdenes" value={orders.length} icon={ICONS.clipboardList} color="bg-green-500" />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Gestión de Productos</h2>
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">ID</th>
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Categoría</th>
              <th className="p-4 font-semibold text-gray-600">Precio</th>
              <th className="p-4 font-semibold text-gray-600">Stock</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-500">{product.id}</td>
                <td className="p-4 font-medium text-gray-800">{product.name}</td>
                <td className="p-4 text-gray-600">{product.category}</td>
                <td className="p-4 text-gray-800">${new Intl.NumberFormat('es-AR').format(product.price)}</td>
                <td className="p-4 text-gray-800">{product.stock}</td>
                <td className="p-4 flex justify-center space-x-2">
                  <Link to={`/admin/product/edit/${product.id}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                    <Icon path={ICONS.edit} className="w-5 h-5" />
                  </Link>
                  <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait">
                    {deletingId === product.id ? (
                      <Spinner className="w-5 h-5 text-red-500" />
                    ) : (
                      <Icon path={ICONS.delete} className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

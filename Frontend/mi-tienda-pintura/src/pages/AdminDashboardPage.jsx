// Frontend/mi-tienda-pintura/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import { StatusBadge } from './AdminOrdersPage';
import { fetchWithCsrf } from '../api/api'; // Importar

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ICONS = {
    revenue: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-.96.73-1.65 2.2-1.65 1.22 0 2.2.61 2.2 1.62h2.05c-.06-2.26-1.76-3.87-4.25-3.87-2.35 0-4.25 1.5-4.25 3.75 0 2.75 2.52 3.86 5.02 4.51 2.26.59 2.98 1.2 2.98 2.16 0 1.05-.83 1.78-2.3 1.78-1.42 0-2.3-.66-2.3-1.78h-2.05c.08 2.33 1.81 3.93 4.35 3.93 2.48 0 4.35-1.53 4.35-3.83.01-2.65-2.2-3.8-5.05-4.42z",
    orders: "M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.48 10 10 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z",
    users: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 12.78l-7-4V10l7 4.22V18l-7-4v-1.54l7 4zM13 18v-4.22l7-4V10l-7 4zM12 2.22L18.09 6 12 9.78 5.91 6 12 2.22z",
    products: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 18V6h5v12H4zm7 0V6h9v12h-9z",
};

const StatCard = ({ title, value, icon, color, format = (v) => v }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`rounded-full p-3 ${color}`}>
      <Icon path={icon} className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{format(value)}</p>
    </div>
  </div>
);

const SalesChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="text-center p-4 text-gray-500">No hay datos de ventas para mostrar.</div>;
    }
    const maxValue = Math.max(...data.map(d => d.dailyRevenue));
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

    return (
        <div className="w-full h-80 bg-gray-50 p-4 rounded-lg flex flex-col">
            <h3 className="font-bold text-gray-700 mb-4">Ventas (Últimos 30 días)</h3>
            <div className="flex-grow flex items-end space-x-2">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group">
                        <div className="relative w-full h-full flex items-end">
                            <div
                                className="w-full bg-blue-300 hover:bg-blue-400 transition-colors rounded-t-md"
                                style={{ height: `${(d.dailyRevenue / maxValue) * 100}%` }}
                            ></div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                ${new Intl.NumberFormat('es-AR').format(d.dailyRevenue)}
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{formatDate(d.date)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetchWithCsrf(`${API_URL}/api/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al cargar las analíticas');
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
        showNotification(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchAnalytics();
    }
  }, [token, showNotification]);

  if (loading) return <div className="text-center p-10"><Spinner className="w-12 h-12 mx-auto text-[#0F3460]" /></div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!analytics) return null;

  const { kpis, topProducts, salesOverTime, recentOrders } = analytics;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard de Analíticas</h1>
        <div className="flex flex-wrap gap-2 sm:gap-4">
            <Link to="/admin/products" className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path={ICONS.products} className="w-5 h-5" />
                <span>Gestionar Productos</span>
            </Link>
            <Link to="/admin/orders" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path={ICONS.orders} className="w-5 h-5" />
                <span>Gestionar Órdenes</span>
            </Link>
            <Link to="/admin/coupons" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM13 20.01L4 11V4h7v-.01l9 9-7 7.01zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z" className="w-5 h-5" />
                <span>Gestionar Cupones</span>
            </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ingresos Totales" value={kpis.totalRevenue || 0} icon={ICONS.revenue} color="bg-green-500" format={(v) => `$${new Intl.NumberFormat('es-AR').format(v)}`} />
        <StatCard title="Nuevas Órdenes (30d)" value={kpis.newOrders || 0} icon={ICONS.orders} color="bg-blue-500" />
        <StatCard title="Nuevos Clientes (30d)" value={kpis.newCustomers} icon={ICONS.users} color="bg-yellow-500" />
        <StatCard title="Productos Activos" value={kpis.activeProducts || 0} icon={ICONS.box} color="bg-indigo-500" />
      </div>

      {/* Gráficos y Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <SalesChart data={salesOverTime} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-gray-700 mb-4">Productos Más Vendidos</h3>
            <ul className="space-y-3">
                {topProducts.map((product, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{product.name}</span>
                        <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{product.totalSold} vendidos</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>
      
      {/* Órdenes Recientes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Órdenes Recientes</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">ID</th>
                  <th className="p-4 font-semibold text-gray-600">Cliente</th>
                  <th className="p-4 font-semibold text-gray-600">Fecha</th>
                  <th className="p-4 font-semibold text-gray-600">Total</th>
                  <th className="p-4 font-semibold text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-medium text-blue-600 hover:underline">
                        <Link to={`/admin/orders`}>#{order.id}</Link>
                    </td>
                    <td className="p-4 text-gray-600">{order.user_email}</td>
                    <td className="p-4 text-gray-600">{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="p-4 text-gray-800">${new Intl.NumberFormat('es-AR').format(order.total_amount)}</td>
                    <td className="p-4"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

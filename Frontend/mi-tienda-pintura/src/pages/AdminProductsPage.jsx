// Frontend/mi-tienda-pintura/src/pages/AdminProductsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ICONS = {
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    upload: "M9 16h6v-6h4l-7-7-7-7h4v6zm-4 2h14v2H5v-2z",
    sparkles: "M12 2L9.5 7.5L4 10l5.5 2.5L12 18l2.5-5.5L20 10l-5.5-2.5z",
    cache: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM5 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C14.03 4.46 12.57 4 11 4c-4.42 0-8 3.58-8 8H0l4 4 4-4H5z"
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await fetch(`${API_URL}/api/products?page=1&limit=100`);
        if (!productsResponse.ok) throw new Error('Error al cargar los productos');
        const productsData = await productsResponse.json();
        setProducts(productsData.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setProductToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    setDeletingId(productToDelete.id);
    closeDeleteModal();

    try {
      const response = await fetch(`${API_URL}/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Error al eliminar el producto');
      }
      setProducts(products.filter(p => p.id !== productToDelete.id));
      showNotification('Producto desactivado con éxito.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('¿Estás seguro de que quieres limpiar toda la caché de productos? Esto puede hacer que el sitio cargue más lento temporalmente.')) {
      return;
    }
    setIsClearingCache(true);
    try {
      const response = await fetch(`${API_URL}/api/utils/clear-cache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al limpiar la caché');
      }
      showNotification(data.message, 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsClearingCache(false);
    }
  };


  if (loading) return <div className="text-center p-10"><Spinner className="w-12 h-12 animate-spin mx-auto text-[#0F3460]" /></div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <AnimatePresence>
        {isModalOpen && (
          <ConfirmationModal
            isOpen={isModalOpen}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteConfirm}
            title="Desactivar Producto"
            message={`¿Estás seguro de que quieres desactivar "${productToDelete?.name}"? No se eliminará permanentemente.`}
            confirmText="Sí, Desactivar"
            iconPath={ICONS.delete}
            iconColor="text-red-500"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
        <div className="flex flex-wrap gap-2 sm:gap-4">
            <button onClick={handleClearCache} disabled={isClearingCache} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400">
                {isClearingCache ? <Spinner className="w-5 h-5" /> : <Icon path={ICONS.cache} className="w-5 h-5" />}
                <span>Limpiar Caché</span>
            </button>
            <Link to="/admin/product/new" className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                <Icon path={ICONS.add} className="w-5 h-5" />
                <span>Crear Producto</span>
            </Link>
             <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Dashboard</Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
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
                  <button onClick={() => openDeleteModal(product)} disabled={deletingId === product.id} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait">
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

export default AdminProductsPage;

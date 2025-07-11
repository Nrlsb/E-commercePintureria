// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminDashboardPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al eliminar el producto');
        setProducts(products.filter(p => p.id !== productId));
        alert('Producto eliminado con éxito');
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="text-center p-10">Cargando productos...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        {/* --- CAMBIO: Añadimos un link a la nueva página de órdenes --- */}
        <div className="flex space-x-4">
            <Link to="/admin/orders" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Gestionar Órdenes
            </Link>
            <Link to="/admin/product/new" className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                Crear Producto
            </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Gestión de Productos</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-4">ID</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{product.id}</td>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">${new Intl.NumberFormat('es-AR').format(product.price)}</td>
                <td className="p-4 flex space-x-2">
                  <Link to={`/admin/product/edit/${product.id}`} className="text-blue-600 hover:underline">Editar</Link>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Eliminar</button>
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

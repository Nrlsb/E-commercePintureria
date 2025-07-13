// src/pages/ProductFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProductFormPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [product, setProduct] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    old_price: '',
    image_url: '',
    description: '',
    stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(productId);

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/products/${productId}`);
          const data = await response.json();
          setProduct({
            name: data.name || '',
            brand: data.brand || '',
            category: data.category || '',
            price: data.price || '',
            old_price: data.old_price || '',
            image_url: data.image_url || '',
            description: data.description || '',
            stock: data.stock || 0,
          });
        } catch (err) {
          setError('Error al cargar el producto');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEditing ? `${API_URL}/api/products/${productId}` : `${API_URL}/api/products`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            ...product,
            price: parseFloat(product.price) || 0,
            old_price: parseFloat(product.old_price) || null,
            stock: parseInt(product.stock, 10) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Error al actualizar el producto' : 'Error al crear el producto');
      }

      alert(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
      navigate('/admin');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div className="text-center p-10">Cargando formulario...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
      </h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField label="Nombre" name="name" value={product.name} onChange={handleChange} required />
          <InputField label="Marca" name="brand" value={product.brand} onChange={handleChange} required />
          <InputField label="Categoría" name="category" value={product.category} onChange={handleChange} required />
          <InputField label="Precio" name="price" type="number" value={product.price} onChange={handleChange} required />
          <InputField label="Stock disponible" name="stock" type="number" value={product.stock} onChange={handleChange} required />
          <InputField label="Precio Anterior (Opcional)" name="old_price" type="number" value={product.old_price} onChange={handleChange} />
          <InputField label="URL de la Imagen" name="image_url" value={product.image_url} onChange={handleChange} required />
          <div>
            <label className="block mb-2 font-medium text-gray-700">Descripción</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]"
              rows="4"
              required
            ></textarea>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div className="flex justify-end space-x-4">
            <Link to="/admin" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancelar</Link>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400">
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block mb-2 font-medium text-gray-700">{label}</label>
    <input {...props} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
  </div>
);

export default ProductFormPage;

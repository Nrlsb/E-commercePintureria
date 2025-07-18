// src/pages/ProductFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- NUEVO: Componente para la subida de imagen ---
const ImageUploader = ({ imageUrl, onUploadSuccess, token }) => {
  const [uploading, setUploading] = useState(false);
  const showNotification = useNotificationStore(state => state.showNotification);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('productImage', file);

    try {
      const response = await fetch(`${API_URL}/api/uploads/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir la imagen');
      }
      
      onUploadSuccess(data.imageUrl); // Notificamos al padre con la nueva URL
      showNotification('Imagen subida y optimizada con éxito.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };
  
  const fullImageUrl = imageUrl && imageUrl.startsWith('http')
    ? imageUrl
    : `${API_URL}${imageUrl}`;

  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">Imagen del Producto</label>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
          {imageUrl ? (
            <img src={fullImageUrl} alt="Vista previa" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <span className="text-sm text-gray-500">Sin imagen</span>
          )}
        </div>
        <div className="relative">
          <input
            type="file"
            id="imageUpload"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <label
            htmlFor="imageUpload"
            className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'bg-gray-200 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <>
                <Spinner className="w-5 h-5 mr-2 text-gray-600" />
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <Icon path="M9 16h6v-6h4l-7-7-7-7h4v6zm-4 2h14v2H5v-2z" className="w-5 h-5 mr-2" />
                <span>Cambiar Imagen</span>
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
};


const ProductFormPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [product, setProduct] = useState({
    name: '', brand: '', category: '', price: '', old_price: '',
    image_url: '', description: '', stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(productId);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      const fetchProduct = async () => {
        try {
          const response = await fetch(`${API_URL}/api/products/${productId}`);
          if (!response.ok) throw new Error('No se pudo cargar el producto.');
          const data = await response.json();
          setProduct({
            name: data.name || '', brand: data.brand || '', category: data.category || '',
            price: data.price || '', old_price: data.old_price || '', image_url: data.image_url || '',
            description: data.description || '', stock: data.stock || 0,
          });
        } catch (err) {
          setError(err.message);
          showNotification(err.message, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, isEditing, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUploadSuccess = (newImageUrl) => {
    setProduct(prev => ({ ...prev, image_url: newImageUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.image_url) {
        showNotification('Por favor, sube una imagen para el producto.', 'error');
        return;
    }
    setLoading(true);
    setError(null);

    const url = isEditing ? `${API_URL}/api/products/${productId}` : `${API_URL}/api/products`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            ...product,
            price: parseFloat(product.price) || 0,
            old_price: parseFloat(product.old_price) || null,
            stock: parseInt(product.stock, 10) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || (isEditing ? 'Error al actualizar' : 'Error al crear'));
      }

      showNotification(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito!`, 'success');
      navigate('/admin');

    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div className="text-center p-10"><Spinner className="w-12 h-12 text-[#0F3460] mx-auto" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Nombre del Producto" name="name" value={product.name} onChange={handleChange} required />
              <InputField label="Marca" name="brand" value={product.brand} onChange={handleChange} required />
              <InputField label="Categoría" name="category" value={product.category} onChange={handleChange} required />
              <InputField label="Stock disponible" name="stock" type="number" value={product.stock} onChange={handleChange} required />
              <InputField label="Precio" name="price" type="number" value={product.price} onChange={handleChange} required step="0.01" />
              <InputField label="Precio Anterior (Opcional)" name="old_price" type="number" value={product.old_price} onChange={handleChange} step="0.01" />
            </div>

            {/* --- Componente de subida de imagen reemplaza el input de URL --- */}
            <ImageUploader 
              imageUrl={product.image_url} 
              onUploadSuccess={handleImageUploadSuccess}
              token={token}
            />

            <div>
              <label className="block mb-2 font-medium text-gray-700">Descripción</label>
              <textarea name="description" value={product.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" rows="4" required></textarea>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center col-span-2">{error}</p>}
            
            <div className="flex justify-end space-x-4 pt-4">
              <Link to="/admin" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancelar</Link>
              <button type="submit" disabled={loading} className="w-40 flex justify-center items-center px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400">
                {loading ? <Spinner /> : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
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

// src/pages/ProductFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ImageUploader = ({ imageUrls, onUploadSuccess, onFileSelect, token }) => {
  const [uploading, setUploading] = useState(false);
  const showNotification = useNotificationStore(state => state.showNotification);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    onFileSelect(file);
    setUploading(true);
    const formData = new FormData();
    formData.append('productImage', file);

    try {
      const response = await fetchWithCsrf(`${API_URL}/api/uploads/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al subir la imagen');
      
      onUploadSuccess(data.imageUrls);
      showNotification('Imagen subida y optimizada con éxito.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };
  
  const previewUrl = imageUrls?.medium;

  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">Imagen del Producto</label>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain rounded-lg" />
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
              <><Spinner className="w-5 h-5 mr-2 text-gray-600" /><span>Subiendo...</span></>
            ) : (
              <><Icon path="M9 16h6v-6h4l-7-7-7-7h4v6zm-4 2h14v2H5v-2z" className="w-5 h-5 mr-2" /><span>Cambiar Imagen</span></>
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
    image_urls: {}, description: '', stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  
  // --- INICIO DE CAMBIOS ---
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [descriptionTone, setDescriptionTone] = useState('persuasivo');
  // --- FIN DE CAMBIOS ---

  const isEditing = Boolean(productId);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      fetch(`${API_URL}/api/products/${productId}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error('No se pudo cargar el producto.')))
        .then(data => {
            setProduct({
                name: data.name || '', brand: data.brand || '', category: data.category || '',
                price: data.price || '', old_price: data.oldPrice || '', 
                image_urls: data.imageUrl || {},
                description: data.description || '', stock: data.stock || 0,
            })
        })
        .catch(err => {
            setError(err.message);
            showNotification(err.message, 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [productId, isEditing, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUploadSuccess = (newImageUrls) => {
    setProduct(prev => ({ ...prev, image_urls: newImageUrls }));
  };
  
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
  });

  const handleAIDataGeneration = async () => {
    if (!uploadedImageFile) {
        showNotification('Primero debes seleccionar una imagen.', 'error');
        return;
    }
    setIsAiLoading(true);
    try {
        const base64ImageData = await fileToBase64(uploadedImageFile);
        const response = await fetchWithCsrf(`${API_URL}/api/uploads/analyze-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ imageData: base64ImageData, mimeType: uploadedImageFile.type })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'La IA no pudo procesar la imagen.');

        setProduct(prev => ({
            ...prev,
            name: data.name || prev.name,
            description: data.description || prev.description,
            category: data.category || prev.category,
        }));
        showNotification('Datos generados por IA.', 'success');

    } catch (err) {
        showNotification(err.message, 'error');
    } finally {
        setIsAiLoading(false);
    }
  };

  // --- INICIO DE CAMBIOS ---
  const handleGenerateDescription = async () => {
    if (!product.name || !product.brand) {
        showNotification('El nombre y la marca del producto son necesarios para generar una descripción.', 'error');
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const response = await fetchWithCsrf(`${API_URL}/api/uploads/generate-description`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productName: product.name, brand: product.brand, tone: descriptionTone })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'No se pudo generar la descripción.');

        setProduct(prev => ({ ...prev, description: data.description }));
        showNotification('Descripción generada con éxito.', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    } finally {
        setIsGeneratingDesc(false);
    }
  };
  // --- FIN DE CAMBIOS ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.image_urls || !product.image_urls.medium) {
        showNotification('Por favor, sube una imagen para el producto.', 'error');
        return;
    }
    setLoading(true);
    setError(null);

    const url = isEditing ? `${API_URL}/api/products/${productId}` : `${API_URL}/api/products`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            ...product,
            price: parseFloat(product.price) || 0,
            old_price: parseFloat(product.old_price) || null,
            stock: parseInt(product.stock, 10) || 0,
            image_url: JSON.stringify(product.image_urls),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || (isEditing ? 'Error al actualizar' : 'Error al crear'));
      }

      showNotification(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito!`, 'success');
      navigate('/admin/products');

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

            <ImageUploader 
              imageUrls={product.image_urls} 
              onUploadSuccess={handleImageUploadSuccess}
              onFileSelect={setUploadedImageFile}
              token={token}
            />
            
            <button
                type="button"
                onClick={handleAIDataGeneration}
                disabled={!uploadedImageFile || isAiLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isAiLoading ? (
                    <><Spinner /><span>Analizando imagen...</span></>
                ) : (
                    <>
                        <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" className="w-5 h-5" />
                        <span>Sugerir Nombre/Categoría con IA</span>
                    </>
                )}
            </button>

            {/* --- INICIO DE CAMBIOS --- */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700">Descripción</label>
                    <div className="flex items-center gap-2">
                        <select
                            value={descriptionTone}
                            onChange={(e) => setDescriptionTone(e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm"
                            disabled={isGeneratingDesc}
                        >
                            <option value="persuasivo">Tono Persuasivo</option>
                            <option value="formal">Tono Formal</option>
                            <option value="informal">Tono Informal</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc}
                            className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                        >
                            {isGeneratingDesc ? <Spinner className="w-4 h-4" /> : <Icon path="M12 2L9.5 7.5L4 10l5.5 2.5L12 18l2.5-5.5L20 10l-5.5-2.5z" className="w-4 h-4" />}
                            <span>Generar</span>
                        </button>
                    </div>
                </div>
                <textarea name="description" value={product.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" rows="6" required></textarea>
            </div>
            {/* --- FIN DE CAMBIOS --- */}
            
            {error && <p className="text-red-500 text-sm text-center col-span-2">{error}</p>}
            
            <div className="flex justify-end space-x-4 pt-4">
              <Link to="/admin/products" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancelar</Link>
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

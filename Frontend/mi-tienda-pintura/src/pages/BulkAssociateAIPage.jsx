// Frontend/mi-tienda-pintura/src/pages/BulkAssociateAIPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const BulkAssociateAIPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      showNotification('Por favor, selecciona al menos un archivo.', 'error');
      return;
    }
    setLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('productImages', file);
    });

    try {
      const response = await fetch(`${API_URL}/api/uploads/bulk-associate-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en la asociación masiva');
      }
      setUploadResult(data);
      showNotification('Proceso completado. Revisa los resultados.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
      document.getElementById('file-upload').value = '';
      setFiles([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Asociación Masiva de Imágenes con IA</h1>
          <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6 border-l-4 border-teal-500 pl-4">
          <h2 className="font-bold text-lg">Instrucciones</h2>
          <p className="text-gray-600">Sube un lote de imágenes de productos. La IA analizará cada imagen e intentará encontrar un producto existente en tu catálogo que coincida para asociarla.</p>
          <p className="text-gray-600 font-semibold mt-2">Este proceso reemplazará la imagen actual de los productos que encuentre.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Seleccionar imágenes:</label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="text-right">
            <button type="submit" disabled={loading || files.length === 0} className="w-64 flex justify-center items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-400">
              {loading ? <Spinner /> : `Subir y Asociar ${files.length} archivo(s)`}
            </button>
          </div>
        </form>

        {uploadResult && (
          <div className="mt-8">
            <h3 className="font-bold text-lg">Resultados de la Asociación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-green-800">Imágenes Asociadas ({uploadResult.success.length})</h4>
                <ul className="text-sm text-green-700 list-disc list-inside">
                  {uploadResult.success.map(item => 
                    <li key={item.matchedProductId}>
                      {item.fileName} &rarr; <Link to={`/admin/product/edit/${item.matchedProductId}`} className="font-bold hover:underline">Asociada a "{item.matchedProductName}"</Link>
                    </li>
                  )}
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-red-800">Fallos ({uploadResult.failed.length})</h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {uploadResult.failed.map((item, index) => <li key={index}><b>{item.file}:</b> {item.reason}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkAssociateAIPage;

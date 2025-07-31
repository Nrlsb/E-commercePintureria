// Frontend/mi-tienda-pintura/src/pages/BulkCreateAIPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import { fetchWithCsrf } from '../api/api'; // Importar

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Componente de Barra de Progreso
const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
    <div
      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const BulkCreateAIPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  useEffect(() => {
    let interval;
    if (loading && files.length > 0) {
      const totalFiles = files.length;
      let processedFiles = 0;
      const estimatedTimePerFile = 3000; 

      interval = setInterval(() => {
        processedFiles++;
        const newProgress = Math.min((processedFiles / totalFiles) * 100, 100);
        setProgress(newProgress);
        setProgressText(`Procesando imagen ${processedFiles} de ${totalFiles}...`);
        
        if (processedFiles >= totalFiles) {
          clearInterval(interval);
          setProgressText('Finalizando proceso, por favor espera...');
        }
      }, estimatedTimePerFile);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, files.length]);

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
    setProgress(0);
    setProgressText('Iniciando subida...');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('productImages', file);
    });

    try {
      const response = await fetchWithCsrf(`${API_URL}/api/uploads/bulk-create-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en la creación masiva de productos');
      }
      setUploadResult(data);
      showNotification('Proceso completado. Revisa los resultados.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressText('');
      document.getElementById('file-upload').value = '';
      setFiles([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Creación Masiva de Productos con IA</h1>
          <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6 border-l-4 border-purple-500 pl-4">
          <h2 className="font-bold text-lg">Instrucciones</h2>
          <p className="text-gray-600">Sube las imágenes de tus nuevos productos. La IA generará un nombre, descripción y categoría para cada uno, creando un "borrador" del producto.</p>
          <p className="text-gray-600 font-semibold mt-2">Luego, deberás editar cada producto para ajustar el precio, stock y otros detalles antes de que aparezca en la tienda.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Seleccionar imágenes (hasta 50):</label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="my-4">
              <p className="text-center text-purple-700 font-semibold">{progressText}</p>
              <ProgressBar progress={progress} />
            </div>
          )}

          <div className="text-right">
            <button type="submit" disabled={loading || files.length === 0} className="w-64 flex justify-center items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400">
              {loading ? <Spinner /> : `Subir y Analizar ${files.length} archivo(s)`}
            </button>
          </div>
        </form>

        {uploadResult && (
          <div className="mt-8">
            <h3 className="font-bold text-lg">Resultados de la Creación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-green-800">Productos Creados ({uploadResult.success.length})</h4>
                <ul className="text-sm text-green-700 list-disc list-inside">
                  {uploadResult.success.map(item => 
                    <li key={item.productId}>
                      {item.fileName} &rarr; <Link to={`/admin/product/edit/${item.productId}`} className="font-bold hover:underline">Editar "{item.name}" (ID: {item.productId})</Link>
                    </li>
                  )}
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-red-800">Fallos ({uploadResult.failed.length})</h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {uploadResult.failed.map((item, index) => <li key={index}>{item.file}: {item.reason}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkCreateAIPage;

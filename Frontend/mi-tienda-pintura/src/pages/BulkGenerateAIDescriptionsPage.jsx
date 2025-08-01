// Frontend/mi-tienda-pintura/src/pages/BulkGenerateAIDescriptionsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
    <div
      className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const BulkGenerateAIDescriptionsPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [tone, setTone] = useState('persuasivo');

  const token = useAuthStore(state => state.token);
  const showNotification = useNotificationStore(state => state.showNotification);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetchWithCsrf(`${API_URL}/api/products?limit=1000`); // Fetch all products
        if (!response.ok) throw new Error('No se pudieron cargar los productos.');
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        showNotification(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [showNotification]);

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedProducts.size === 0) {
      showNotification('Por favor, selecciona al menos un producto.', 'error');
      return;
    }
    setIsProcessing(true);
    setProcessResult(null);
    setProgress(0);
    setProgressText('Iniciando proceso...');

    const productIds = Array.from(selectedProducts);
    const total = productIds.length;
    let processedCount = 0;

    // Simulación de progreso en el cliente para una mejor UX
    const progressInterval = setInterval(() => {
        processedCount++;
        setProgressText(`Procesando producto ${processedCount} de ${total}...`);
        setProgress((processedCount / total) * 100);
        if (processedCount >= total) {
            clearInterval(progressInterval);
            setProgressText('Finalizando y guardando en la base de datos...');
        }
    }, 2000); // Coincide con el retardo del backend

    try {
      const response = await fetchWithCsrf(`${API_URL}/api/uploads/bulk-generate-descriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds, tone }),
      });

      clearInterval(progressInterval); // Detener el simulador de progreso
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en el proceso masivo');
      }
      setProcessResult(data);
      showNotification('Proceso completado. Revisa los resultados.', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressText('');
    }
  };

  if (loading) return <div className="text-center p-10"><Spinner className="w-12 h-12 mx-auto text-[#0F3460]" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Generación Masiva de Descripciones con IA</h1>
          <Link to="/admin/products" className="text-blue-600 hover:underline">&larr; Volver a Productos</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6 border-l-4 border-green-500 pl-4">
          <h2 className="font-bold text-lg">Instrucciones</h2>
          <p className="text-gray-600">Selecciona los productos de la lista, elige un tono de comunicación y la IA generará y guardará una nueva descripción para cada uno.</p>
          <p className="text-gray-600 font-semibold mt-2">Este proceso sobrescribirá las descripciones existentes de los productos seleccionados.</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <label htmlFor="tone-select" className="font-medium">Tono de la descripción:</label>
                <select id="tone-select" value={tone} onChange={(e) => setTone(e.target.value)} className="border-gray-300 rounded-md shadow-sm">
                    <option value="persuasivo">Persuasivo</option>
                    <option value="formal">Formal</option>
                    <option value="informal">Informal</option>
                    <option value="técnico">Técnico</option>
                </select>
            </div>
            <button onClick={handleSubmit} disabled={isProcessing || selectedProducts.size === 0} className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                {isProcessing ? <Spinner /> : `Generar para ${selectedProducts.size} producto(s)`}
            </button>
        </div>

        {isProcessing && (
            <div className="my-4">
              <p className="text-center text-green-700 font-semibold">{progressText}</p>
              <ProgressBar progress={progress} />
            </div>
        )}

        <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
            <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="p-4">
                            <input type="checkbox" onChange={handleSelectAll} checked={products.length > 0 && selectedProducts.size === products.length} />
                        </th>
                        <th className="p-4 font-semibold">Producto</th>
                        <th className="p-4 font-semibold">Descripción Actual (extracto)</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id} className="border-t hover:bg-gray-50">
                            <td className="p-4">
                                <input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => handleSelectProduct(product.id)} />
                            </td>
                            <td className="p-4 font-medium">{product.name}</td>
                            <td className="p-4 text-sm text-gray-500 italic">
                                {product.description ? `"${product.description.substring(0, 70)}..."` : 'Sin descripción'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {processResult && (
          <div className="mt-8">
            <h3 className="font-bold text-lg">Resultados del Proceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-green-800">Descripciones Generadas ({processResult.success.length})</h4>
                <ul className="text-sm text-green-700 list-disc list-inside">
                  {processResult.success.map(item => 
                    <li key={item.productId}>
                      <Link to={`/admin/product/edit/${item.productId}`} className="font-bold hover:underline">{item.productName}</Link>
                    </li>
                  )}
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-red-800">Fallos ({processResult.failed.length})</h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {processResult.failed.map((item, index) => <li key={index}><b>{item.productName}:</b> {item.reason}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkGenerateAIDescriptionsPage;

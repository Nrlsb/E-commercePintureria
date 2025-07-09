// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx'; // Necesitamos la tarjeta para productos relacionados

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// El componente ahora también recibe la lista completa de productos
const ProductDetailPage = ({ products, onAddToCart }) => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // Estado para la pestaña activa

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    // Reiniciar la cantidad y la pestaña al cambiar de producto
    setQuantity(1);
    setActiveTab('description');
    window.scrollTo(0, 0); // Hacer scroll al inicio de la página
  }, [productId]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };

  // Filtrar productos relacionados (misma categoría, excluyendo el actual)
  const relatedProducts = product 
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 1. Breadcrumbs (Migas de Pan) */}
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-[#0F3460]">Inicio</Link>
        <span className="mx-2">&gt;</span>
        <Link to={`/category/${product.category}`} className="hover:text-[#0F3460]">{product.category}</Link>
        <span className="mx-2">&gt;</span>
        <span className="font-medium text-gray-700">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Columna de la Imagen */}
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
          <img src={product.imageUrl} alt={`Imagen de ${product.name}`} className="max-w-full h-auto max-h-[500px] object-contain" />
        </div>
        
        {/* Columna de Información y Compra */}
        <div>
          <h2 className="text-gray-500 text-sm uppercase tracking-widest mb-2">{product.brand}</h2>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
          <div className="flex items-baseline mb-6">
            <p className="text-4xl font-bold text-[#0F3460]">${new Intl.NumberFormat('es-AR').format(product.price)}</p>
            {product.oldPrice && (<p className="text-xl text-gray-400 line-through ml-3">${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>)}
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <p className="font-semibold text-lg">Cantidad:</p>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button onClick={() => handleQuantityChange(-1)} className="px-4 py-2 text-xl font-bold hover:bg-gray-100 rounded-l-md transition-colors">-</button>
              <span className="px-6 py-2 text-lg font-semibold">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="px-4 py-2 text-xl font-bold hover:bg-gray-100 rounded-r-md transition-colors">+</button>
            </div>
          </div>
          
          <button onClick={handleAddToCartClick} className="w-full bg-[#0F3460] text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#1a4a8a] transition-colors duration-300">
            Agregar al Carrito
          </button>
        </div>
      </div>

      {/* 2. Pestañas de Información Detallada */}
      <div className="mt-16">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('description')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-[#0F3460] text-[#0F3460]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Descripción
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-[#0F3460] text-[#0F3460]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Detalles Técnicos
            </button>
          </nav>
        </div>
        <div className="py-6">
          {activeTab === 'description' && (
            <p className="text-gray-700 leading-relaxed">{product.description || 'No hay descripción disponible para este producto.'}</p>
          )}
          {activeTab === 'details' && (
            <div className="text-gray-700">
              <ul>
                <li><strong>Marca:</strong> {product.brand}</li>
                <li><strong>Categoría:</strong> {product.category}</li>
                {/* Aquí irían más detalles técnicos si existieran en la DB */}
                <li><strong>Acabado:</strong> Mate (Ejemplo)</li>
                <li><strong>Rendimiento:</strong> 10 m²/L (Ejemplo)</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 3. Sección de Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;

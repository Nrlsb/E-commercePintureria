// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react'; // Importar useEffect
import { useParams, Link } from 'react-router-dom';
// Ya no importamos 'mockProducts'

const ProductDetailPage = ({ onAddToCart }) => {
  const { productId } = useParams(); 
  
  // Estados para el producto, carga y error de esta página
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/products/${productId}`);
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
  }, [productId]); // Se ejecuta cada vez que el productId de la URL cambia

  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!product) return null; // No renderiza nada si no hay producto

  // ... (resto del componente sin cambios)
  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };
  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
        &larr; Volver a la tienda
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
          <img src={product.imageUrl} alt={`Imagen de ${product.name}`} className="max-w-full h-auto max-h-[500px] object-contain"/>
        </div>
        <div>
          <h2 className="text-gray-500 text-sm uppercase tracking-widest mb-2">{product.brand}</h2>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="flex items-baseline mb-6">
            <p className="text-4xl font-bold text-blue-600">${new Intl.NumberFormat('es-AR').format(product.price)}</p>
            {product.oldPrice && (<p className="text-xl text-gray-400 line-through ml-3">${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>)}
          </div>
          <p className="text-gray-700 leading-relaxed mb-8">Descripción detallada del producto...</p>
          <div className="flex items-center space-x-4 mb-6">
            <p className="font-semibold">Cantidad:</p>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button onClick={() => handleQuantityChange(-1)} className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-l-md">-</button>
              <span className="px-6 py-2 text-lg">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-r-md">+</button>
            </div>
          </div>
          <button onClick={handleAddToCartClick} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-blue-700">
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

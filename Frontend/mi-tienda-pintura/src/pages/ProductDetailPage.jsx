// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard.jsx';
import ProductCardSkeleton from '../components/ProductCardSkeleton.jsx';
import StarRating from '../components/StarRating.jsx';
import ReviewList from '../components/ReviewList.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import { useCartStore } from '../stores/useCartStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useNotificationStore } from '../stores/useNotificationStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProductDetailPage = () => {
  const { productId } = useParams();
  
  const { addToCart } = useCartStore();
  const { user, token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // --- NUEVO: Estado específico para productos relacionados ---
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const fetchProductAndReviews = useCallback(async () => {
    try {
      setLoading(true);
      const productResponse = await fetch(`${API_URL}/api/products/${productId}`);
      if (!productResponse.ok) throw new Error('Producto no encontrado');
      const productData = await productResponse.json();
      setProduct(productData);

      const reviewsResponse = await fetch(`${API_URL}/api/products/${productId}/reviews`);
      if (!reviewsResponse.ok) throw new Error('Error al cargar las reseñas');
      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductAndReviews();
    setQuantity(1);
    setActiveTab('description');
    window.scrollTo(0, 0);

    // --- NUEVO: Fetch para obtener productos relacionados desde el nuevo endpoint ---
    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}/related`);
        if (!response.ok) throw new Error('Error al cargar productos relacionados');
        const data = await response.json();
        setRelatedProducts(data);
      } catch (err) {
        console.error(err.message);
        setRelatedProducts([]); // En caso de error, simplemente no mostramos nada
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [productId, fetchProductAndReviews]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
        const newQuantity = prev + amount;
        if (newQuantity < 1) return 1;
        if (product && newQuantity > product.stock) return product.stock;
        return newQuantity;
    });
  };

  const handleAddToCartClick = () => {
    addToCart(product, quantity);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      try {
        const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error al eliminar la reseña' }));
          throw new Error(errorData.message);
        }
        
        showNotification('Reseña eliminada con éxito', 'success');
        fetchProductAndReviews();

      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!product) return null;
  
  const imageUrls = product.imageUrl;
  const src = imageUrls?.large || imageUrls || 'https://placehold.co/500x500/cccccc/ffffff?text=Imagen+no+disponible';
  const srcSet = imageUrls && typeof imageUrls === 'object'
    ? `${imageUrls.small} 400w, ${imageUrls.medium} 800w, ${imageUrls.large} 1200w`
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-[#0F3460]">Inicio</Link>
        <span className="mx-2">&gt;</span>
        <Link to={`/category/${product.category}`} className="hover:text-[#0F3460]">{product.category}</Link>
        <span className="mx-2">&gt;</span>
        <span className="font-medium text-gray-700">{product.name}</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-12"
      >
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
          <img 
            src={src}
            srcSet={srcSet}
            sizes="(max-width: 768px) 90vw, 45vw"
            alt={`Imagen de ${product.name}`} 
            className="max-w-full h-auto max-h-[500px] object-contain"
            loading="lazy"
            width="500"
            height="500"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/500x500/cccccc/ffffff?text=Imagen+no+disponible'; }}
          />
        </div>
        
        <div>
          <h2 className="text-gray-500 text-sm uppercase tracking-widest mb-2">{product.brand}</h2>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
          
          <div className="mb-4">
            <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
          </div>

          <div className="flex items-baseline mb-6">
            <p className="text-4xl font-bold text-[#0F3460]">${new Intl.NumberFormat('es-AR').format(product.price)}</p>
            {product.oldPrice && (<p className="text-xl text-gray-400 line-through ml-3">${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>)}
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <p className="font-semibold text-lg">Cantidad:</p>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button onClick={() => handleQuantityChange(-1)} disabled={product.stock === 0} className="px-4 py-2 text-xl font-bold hover:bg-gray-100 rounded-l-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">-</button>
              <span className="px-6 py-2 text-lg font-semibold">{product.stock > 0 ? quantity : 0}</span>
              <button onClick={() => handleQuantityChange(1)} disabled={product.stock === 0} className="px-4 py-2 text-xl font-bold hover:bg-gray-100 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">+</button>
            </div>
            {product.stock > 0 && product.stock <= 5 && <span className="text-sm text-red-500 font-semibold">¡Últimas {product.stock} unidades!</span>}
            {product.stock > 5 && <span className="text-sm text-gray-500">({product.stock} disponibles)</span>}
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCartClick} 
            disabled={product.stock === 0}
            className="w-full bg-[#0F3460] text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#1a4a8a] transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
          </motion.button>
        </div>
      </motion.div>
      
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
            <button
              onClick={() => setActiveTab('reviews')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-[#0F3460] text-[#0F3460]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Reseñas ({product.reviewCount})
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
                <li><strong>Acabado:</strong> Mate (Ejemplo)</li>
                <li><strong>Rendimiento:</strong> 10 m²/L (Ejemplo)</li>
              </ul>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div>
              {user ? (
                <ReviewForm productId={productId} token={token} onReviewSubmitted={fetchProductAndReviews} />
              ) : (
                <p className="text-center bg-gray-100 p-4 rounded-lg">
                  <Link to="/login" className="font-bold text-[#0F3460] hover:underline">Inicia sesión</Link> para dejar una reseña.
                </p>
              )}
              <ReviewList reviews={reviews} user={user} onDelete={handleDeleteReview} />
            </div>
          )}
        </div>
      </div>

      {/* --- SECCIÓN DE PRODUCTOS RELACIONADOS MEJORADA --- */}
      {(loadingRelated || relatedProducts.length > 0) && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Frecuentemente comprados juntos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingRelated ? (
              [...Array(4)].map((_, index) => <ProductCardSkeleton key={index} />)
            ) : (
              relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;

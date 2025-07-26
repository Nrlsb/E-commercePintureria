// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard.jsx';
import StarRating from '../components/StarRating.jsx';
import ReviewList from '../components/ReviewList.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import Spinner from '../components/Spinner.jsx';
import { useProductStore } from '../stores/useProductStore.js';
import { useCartStore } from '../stores/useCartStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useNotificationStore } from '../stores/useNotificationStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProductDetailPage = () => {
  const { productId } = useParams();
  
  const { products } = useProductStore();
  const { addToCart } = useCartStore();
  const { user, token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);

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
  }, [productId, fetchProductAndReviews]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
        const newQuantity = prev + amount;
        if (newQuantity < 1) return 1;
        if (product && newQuantity > product.stock) return product.stock;
        return newQuantity;
    });
  };

  const handleAddToCartClick = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      showNotification(`${quantity} unidades de ${product.name} agregadas al carrito.`);
    } catch (err) {
      showNotification('Error al agregar al carrito.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      try {
        const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
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

  const relatedProducts = product 
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  if (loading) return (
    <div className="flex justify-center items-center h-screen" role="status" aria-live="polite">
      <Spinner className="w-10 h-10 text-[#0F3460]" />
      <span className="ml-3 text-lg text-gray-700">Cargando producto...</span>
    </div>
  );
  if (error) return <div className="text-center p-10 text-red-500" role="alert" aria-live="assertive">Error: {error}</div>;
  if (!product) return null;
  
  let src, srcSet;
  let parsedImageUrls = product.imageUrl; // Inicializamos con el valor crudo

  // Intentamos parsear la cadena JSON si parece ser una
  if (typeof parsedImageUrls === 'string' && parsedImageUrls.startsWith('{')) {
    try {
      parsedImageUrls = JSON.parse(parsedImageUrls);
    } catch (e) {
      console.error("Error parsing product.imageUrl JSON string:", e);
      parsedImageUrls = null; // Si falla el parseo, tratamos como null
    }
  }

  // Ahora, manejamos parsedImageUrls que puede ser un objeto, una URL string o null
  if (parsedImageUrls && typeof parsedImageUrls === 'object') {
    src = parsedImageUrls.large || parsedImageUrls.medium || parsedImageUrls.small;
    srcSet = '';
    if (parsedImageUrls.small) srcSet += `${parsedImageUrls.small} 400w, `;
    if (parsedImageUrls.medium) srcSet += `${parsedImageUrls.medium} 800w, `;
    if (parsedImageUrls.large) srcSet += `${parsedImageUrls.large} 1200w`;
    srcSet = srcSet.trim().replace(/,$/, '');
  } else {
    // Si parsedImageUrls es una URL string directa o null/undefined
    src = parsedImageUrls || `https://placehold.co/500x500/cccccc/ffffff?text=${encodeURIComponent(product.name || 'Producto')}`; // Fallback para product.name
    srcSet = null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav aria-label="Ruta de navegación" className="text-sm text-gray-500 mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="hover:text-[#0F3460]">Inicio</Link>
          </li>
          <li>
            <span className="mx-2" aria-hidden="true">&gt;</span>
            <Link to={`/category/${product.category}`} className="hover:text-[#0F3460]">{product.category}</Link>
          </li>
          <li>
            <span className="mx-2" aria-hidden="true">&gt;</span>
            <span aria-current="page" className="font-medium text-gray-700">{product.name}</span>
          </li>
        </ol>
      </nav>

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
            alt={`Imagen principal de ${product.name || 'producto'}, marca ${product.brand || 'desconocida'}`} // Fallback para product.name
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
            <p className="text-4xl font-bold text-[#0F3460]" aria-label={`Precio: ${product.price} pesos argentinos`}>${new Intl.NumberFormat('es-AR').format(product.price)}</p>
            {product.oldPrice && (<p className="text-xl text-gray-400 line-through ml-3" aria-label={`Precio anterior: ${product.oldPrice} pesos argentinos`}>${new Intl.NumberFormat('es-AR').format(product.oldPrice)}</p>)}
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <label htmlFor="quantity-input" className="font-semibold text-lg">Cantidad:</label> 
            <div className="flex items-center border border-gray-300 rounded-md">
              <button 
                onClick={() => handleQuantityChange(-1)} 
                disabled={product.stock === 0 || quantity === 1 || addingToCart}
                className="px-4 py-2 text-xl font-bold hover:bg-gray-100 rounded-l-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Disminuir cantidad de ${product.name}`}
              >
                -
              </button>
              <input 
                id="quantity-input"
                type="number" 
                value={product.stock > 0 ? quantity : 0} 
                readOnly
                className="px-6 py-2 text-lg font-semibold w-20 text-center bg-transparent focus:outline-none"
                aria-live="polite"
                aria-atomic="true"
                min="1"
                max={product.stock}
              />
              <button 
                onClick={() => handleQuantityChange(1)} 
                disabled={product.stock === 0 || (product.stock > 0 && quantity >= product.stock) || addingToCart}
                className="px-4 py-2 text-xl font-bold hover:bg-gray-100 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Aumentar cantidad de ${product.name}`}
              >
                +
              </button>
            </div>
            {product.stock > 0 && product.stock <= 5 && <span className="text-sm text-red-500 font-semibold" aria-live="polite">¡Últimas {product.stock} unidades!</span>}
            {product.stock > 5 && <span className="text-sm text-gray-500" aria-live="polite">({product.stock} disponibles)</span>}
            {product.stock === 0 && <span className="text-sm text-red-600 font-semibold" aria-live="assertive">Producto sin stock.</span>}
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCartClick} 
            disabled={product.stock === 0 || addingToCart}
            className="w-full bg-[#0F3460] text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#1a4a8a] transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label={product.stock > 0 ? `Agregar ${quantity} unidades de ${product.name} al carrito` : `Producto sin stock, no se puede agregar al carrito`}
          >
            {addingToCart ? (
              <Spinner className="w-6 h-6 text-white" />
            ) : (
              <>
                {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
      
      <div className="mt-16">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Pestañas de información del producto" role="tablist">
            <button
              onClick={() => setActiveTab('description')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-[#0F3460] text-[#0F3460]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              role="tab"
              aria-selected={activeTab === 'description'}
              aria-controls="panel-description"
              id="tab-description"
              tabIndex={activeTab === 'description' ? 0 : -1}
            >
              Descripción
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-[#0F3460] text-[#0F3460]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              role="tab"
              aria-selected={activeTab === 'details'}
              aria-controls="panel-details"
              id="tab-details"
              tabIndex={activeTab === 'details' ? 0 : -1}
            >
              Detalles Técnicos
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-[#0F3460] text-[#0F3460]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              role="tab"
              aria-selected={activeTab === 'reviews'}
              aria-controls="panel-reviews"
              id="tab-reviews"
              tabIndex={activeTab === 'reviews' ? 0 : -1}
            >
              Reseñas ({product.reviewCount})
            </button>
          </nav>
        </div>
        <div className="py-6">
          {activeTab === 'description' && (
            <div role="tabpanel" id="panel-description" aria-labelledby="tab-description">
              <p className="text-gray-700 leading-relaxed">{product.description || 'No hay descripción disponible para este producto.'}</p>
            </div>
          )}
          {activeTab === 'details' && (
            <div role="tabpanel" id="panel-details" aria-labelledby="tab-details">
              <div className="text-gray-700">
                <h3 className="sr-only">Detalles Técnicos del Producto</h3>
                <ul>
                  <li><strong>Marca:</strong> {product.brand}</li>
                  <li><strong>Categoría:</strong> {product.category}</li>
                  <li><strong>Acabado:</strong> Mate (Ejemplo)</li>
                  <li><strong>Rendimiento:</strong> 10 m²/L (Ejemplo)</li>
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews">
              {user ? (
                <ReviewForm productId={productId} token={token} onReviewSubmitted={fetchProductAndReviews} />
              ) : (
                <p className="text-center bg-gray-100 p-4 rounded-lg" role="note">
                  <Link to="/login" className="font-bold text-[#0F3460] hover:underline">Inicia sesión</Link> para dejar una reseña.
                </p>
              )}
              <ReviewList reviews={reviews} user={user} onDelete={handleDeleteReview} />
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16" aria-labelledby="related-products-heading">
          <h2 id="related-products-heading" className="text-2xl font-bold text-gray-800 mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;

// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard.jsx';
import StarRating from '../components/StarRating.jsx';
// Importamos Spinner para el fallback de Suspense
import Spinner from '../components/Spinner.jsx'; 

import { useProductStore } from '../stores/useProductStore.js';
import { useCartStore } from '../stores/useCartStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useNotificationStore } from '../stores/useNotificationStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Lazy load de los componentes de reseñas
const ReviewList = lazy(() => import('../components/ReviewList.jsx'));
const ReviewForm = lazy(() => import('../components/ReviewForm.jsx'));

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

  const fetchProductAndReviews = useCallback(async () => {
    try {
      setLoading(true);
      const productResponse = await fetch(`${API_URL}/api/products/${productId}`);
      if (!productResponse.ok) throw new Error('Producto no encontrado');
      const productData = await productResponse.json();
      setProduct(productData);

      // Solo cargamos las reseñas si la pestaña de reseñas está activa
      // o si necesitamos el conteo inicial para la pestaña (aunque el conteo puede venir del producto)
      // Para simplificar, las cargamos siempre con el producto para asegurar el reviewCount
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

  // Actualizar el título de la página y la meta descripción para SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Pinturerías Mercurio`;
      
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.name = 'description';
        document.head.appendChild(metaDescriptionTag);
      }
      metaDescriptionTag.content = product.description 
        ? `Comprar ${product.name} de la marca ${product.brand} en Pinturerías Mercurio. ${product.description.substring(0, 150)}...`
        : `Comprar ${product.name} de la marca ${product.brand} en Pinturerías Mercurio.`;
    } else {
      document.title = "Detalle del Producto - Pinturerías Mercurio";
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (metaDescriptionTag) {
        metaDescriptionTag.content = "Descubre los detalles de nuestros productos de pintura y accesorios.";
      }
    }
  }, [product]);

  // Generar datos estructurados (Schema.org) para el producto
  const getProductSchema = (product) => {
    if (!product) return null;

    const imageUrls = product.imageUrl;
    const mainImageUrl = imageUrls?.large || imageUrls?.medium || imageUrls?.small || 'https://placehold.co/500x500/cccccc/ffffff?text=Imagen+no+disponible';

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": mainImageUrl,
      "description": product.description || `Producto de pintura: ${product.name} de la marca ${product.brand}.`,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": product.brand
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "ARS",
        "price": product.price,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };

    if (product.averageRating > 0 && product.reviewCount > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating,
        "reviewCount": product.reviewCount
      };
    }

    return JSON.stringify(schema);
  };

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
    // Usamos un modal de confirmación en lugar de window.confirm
    // Para esta demostración, mantendremos window.confirm por simplicidad,
    // pero en una aplicación real se usaría un componente de modal.
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
      {/* Script para datos estructurados (Schema.org) */}
      {product && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: getProductSchema(product) }} 
        />
      )}

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
            // Se ajusta `sizes` para una mejor responsividad en diferentes viewports
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 400px" 
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
            // Usamos Suspense para mostrar un fallback mientras los componentes de reseña se cargan
            <Suspense fallback={
                <div className="flex justify-center items-center p-8">
                    <Spinner className="w-8 h-8 text-[#0F3460]" />
                    <span className="ml-2 text-gray-600">Cargando reseñas...</span>
                </div>
            }>
              {user ? (
                <ReviewForm productId={productId} token={token} onReviewSubmitted={fetchProductAndReviews} />
              ) : (
                <p className="text-center bg-gray-100 p-4 rounded-lg">
                  <Link to="/login" className="font-bold text-[#0F3460] hover:underline">Inicia sesión</Link> para dejar una reseña.
                </p>
              )}
              <ReviewList reviews={reviews} user={user} onDelete={handleDeleteReview} />
            </Suspense>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;

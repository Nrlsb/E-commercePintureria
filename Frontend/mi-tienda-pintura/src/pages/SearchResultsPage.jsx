// src/pages/SearchResultsPage.jsx
import React, { useEffect } from 'react';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const SearchResultsPage = () => {
  const { 
    products, 
    searchQuery, 
    loading, 
    error, 
    totalProducts, 
    currentPage, 
    totalPages,
    fetchProducts
  } = useProductStore(state => ({
    products: state.products,
    searchQuery: state.searchQuery,
    loading: state.loading,
    error: state.error,
    totalProducts: state.totalProducts,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    fetchProducts: state.fetchProducts,
  }));
  
  // --- INICIO DE MEJORAS SEO ---
  useEffect(() => {
    // Actualizar el título de la página y la meta descripción para SEO
    if (searchQuery) {
      document.title = `Resultados para "${searchQuery}" - Pinturerías Mercurio`;
      
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.name = 'description';
        document.head.appendChild(metaDescriptionTag);
      }
      metaDescriptionTag.content = `Encuentra productos de pintura y accesorios relacionados con "${searchQuery}" en Pinturerías Mercurio. ${totalProducts} resultados disponibles.`;
    } else {
      // Valores por defecto si no hay consulta de búsqueda
      document.title = "Búsqueda - Pinturerías Mercurio";
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (metaDescriptionTag) {
        metaDescriptionTag.content = "Realiza tu búsqueda de productos en Pinturerías Mercurio.";
      }
    }
  }, [searchQuery, totalProducts]); // Dependencias para que se actualice con la búsqueda y el total

  // Generar datos estructurados (Schema.org) para la página de resultados de búsqueda
  const getSearchResultsSchema = (query, products) => {
    if (!query) return null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      "name": `Resultados de búsqueda para "${query}"`,
      "url": window.location.href,
      "description": `Productos encontrados en Pinturerías Mercurio para la búsqueda: ${query}.`,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": products.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.name,
            "url": `${window.location.origin}/product/${product.id}`,
            "image": product.imageUrl?.medium || product.imageUrl?.small || 'https://placehold.co/300x224/cccccc/ffffff?text=Imagen+no+disponible',
            "offers": {
              "@type": "Offer",
              "priceCurrency": "ARS",
              "price": product.price
            }
          }
        }))
      }
    };
    return JSON.stringify(schema);
  };
  // --- FIN DE MEJORAS SEO ---
  
  const handlePageChange = (page) => {
    fetchProducts(null, page); 
    window.scrollTo(0, 0);
  };

  return (
    <div>
      {/* Script para datos estructurados (Schema.org) */}
      {searchQuery && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: getSearchResultsSchema(searchQuery, products) }} 
        />
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-2">Resultados para: <span className="text-blue-600">"{searchQuery}"</span></h1>
      {!loading && <p className="text-gray-600 mb-8">{totalProducts} productos encontrados.</p>}
      
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        loadingMessage={`Buscando productos para "${searchQuery}"...`}
      />

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default SearchResultsPage;

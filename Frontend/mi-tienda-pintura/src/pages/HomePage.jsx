// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  const { products, loading, error, fetchProducts, resetFiltersAndSort, currentPage, totalPages } = useProductStore();

  useEffect(() => {
    resetFiltersAndSort();
    fetchProducts(null, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- INICIO DE MEJORAS SEO ---
  useEffect(() => {
    // Actualizar el título de la página y la meta descripción para SEO
    document.title = "Pinturerías Mercurio - Tu Tienda Online de Pinturas y Accesorios";
    
    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.name = 'description';
      document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.content = "Descubre la mayor variedad de pinturas, esmaltes, impermeabilizantes y accesorios para renovar tu hogar. ¡Calidad y asesoramiento experto en Pinturerías Mercurio!";
  }, []);

  // Generar datos estructurados (Schema.org) para la página de inicio
  const getHomePageSchema = () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Pinturerías Mercurio",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
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
    <>
      {/* Script para datos estructurados (Schema.org) */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: getHomePageSchema() }} 
      />

      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
        />

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </section>
    </>
  );
};

export default HomePage;

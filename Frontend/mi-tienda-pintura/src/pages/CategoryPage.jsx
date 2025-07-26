// src/pages/CategoryPage.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductFilters from '../components/ProductFilters.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const CategoryPage = () => {
  const { categoryName } = useParams();
  
  const { products, loading, error, fetchProducts, resetFiltersAndSort, currentPage, totalPages } = useProductStore();

  useEffect(() => {
    resetFiltersAndSort();
    fetchProducts(categoryName, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  // --- INICIO DE MEJORAS SEO ---
  useEffect(() => {
    // Actualizar el título de la página y la meta descripción para SEO
    if (categoryName) {
      document.title = `${categoryName} - Pinturerías Mercurio`;
      
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (!metaDescriptionTag) {
        metaDescriptionTag = document.createElement('meta');
        metaDescriptionTag.name = 'description';
        document.head.appendChild(metaDescriptionTag);
      }
      metaDescriptionTag.content = `Explora nuestra selección de productos de pintura en la categoría ${categoryName} en Pinturerías Mercurio. Encuentra todo lo que necesitas para tus proyectos.`;
    } else {
      // Valores por defecto si la categoría no está definida
      document.title = "Categorías - Pinturerías Mercurio";
      let metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (metaDescriptionTag) {
        metaDescriptionTag.content = "Descubre todas las categorías de productos de pintura disponibles en nuestra tienda.";
      }
    }
  }, [categoryName]);

  // Generar datos estructurados (Schema.org) para la página de categoría
  const getCategorySchema = (categoryName) => {
    if (!categoryName) return null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${categoryName} - Pinturerías Mercurio`,
      "description": `Explora nuestra selección de productos de pintura en la categoría ${categoryName} en Pinturerías Mercurio.`,
      "url": window.location.href,
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
    fetchProducts(categoryName, page);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      {/* Script para datos estructurados (Schema.org) */}
      {categoryName && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: getCategorySchema(categoryName) }} 
        />
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Categoría: <span className="text-blue-600">{categoryName}</span></h1>
      
      <ProductFilters category={categoryName} />

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
    </div>
  );
};

export default CategoryPage;

// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductGrid from '../components/ProductGrid.jsx'; // Se importa el nuevo componente
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  const { products, loading, error, fetchProducts, resetFiltersAndSort } = useProductStore();

  useEffect(() => {
    resetFiltersAndSort();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        
        {/* Se usa el componente ProductGrid para renderizar la lista */}
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
        />
      </section>
    </>
  );
};

export default HomePage;

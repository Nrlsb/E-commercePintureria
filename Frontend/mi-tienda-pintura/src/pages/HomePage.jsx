// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  const products = useProductStore(state => state.products);
  const loading = useProductStore(state => state.loading);
  const error = useProductStore(state => state.error);
  const fetchProducts = useProductStore(state => state.fetchProducts);
  const resetFiltersAndSort = useProductStore(state => state.resetFiltersAndSort);

  // --- CONSOLE LOG PARA DEBUGGING ---
  console.log('HomePage renderizando...');

  useEffect(() => {
    // --- CONSOLE LOG PARA DEBUGGING ---
    console.log('%c[HomePage] useEffect ejecutándose.', 'color: purple; font-weight: bold;');
    resetFiltersAndSort();
    fetchProducts();
  }, []); // El array vacío es correcto, solo debe ejecutarse una vez.

  return (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        {loading && <div className="text-center p-10">Cargando productos...</div>}
        {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard 
                  key={product.id} 
                  product={product}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default HomePage;

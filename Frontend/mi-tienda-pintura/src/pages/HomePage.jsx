// src/pages/HomePage.jsx
import React from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  // Obtenemos los productos directamente del store
  const products = useProductStore(state => state.products);

  return (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard 
                key={product.id} 
                product={product}
                // onAddToCart ya no se pasa como prop
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;

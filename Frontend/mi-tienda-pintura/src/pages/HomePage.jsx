// src/pages/HomePage.jsx
import React from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
// Ya no importamos 'mockProducts'

const HomePage = ({ products, onAddToCart }) => { // Recibe 'products' como prop
  return (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Mapea sobre los productos recibidos */}
          {products.map(product => (
            <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;

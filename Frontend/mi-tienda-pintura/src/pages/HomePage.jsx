// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  // Obtenemos los productos y la acción para buscarlos desde el store
  const { products, fetchProducts } = useProductStore();

  // Usamos useEffect para asegurarnos de que se carguen todos los productos
  // cada vez que el usuario visite la página de inicio.
  useEffect(() => {
    // Llamamos a fetchProducts sin argumentos para obtener la lista completa.
    fetchProducts();
  }, [fetchProducts]); // El array de dependencias asegura que solo se ejecute una vez por carga del componente.

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
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;

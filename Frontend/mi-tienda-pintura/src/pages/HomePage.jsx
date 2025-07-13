// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  // Seleccionamos individualmente el estado y las acciones que necesitamos
  const products = useProductStore(state => state.products);
  const fetchProducts = useProductStore(state => state.fetchProducts);
  const resetFiltersAndSort = useProductStore(state => state.resetFiltersAndSort);

  useEffect(() => {
    // Cuando el usuario llega a la página de inicio, reseteamos cualquier filtro
    // o ordenamiento que pudiera haber aplicado en otras páginas.
    resetFiltersAndSort();
    // Luego, buscamos todos los productos sin filtros.
    fetchProducts();
  }, []); // El array de dependencias vacío asegura que esto se ejecute UNA SOLA VEZ al montar el componente.

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

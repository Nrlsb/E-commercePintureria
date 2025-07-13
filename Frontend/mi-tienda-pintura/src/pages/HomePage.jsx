// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  // Obtenemos los productos y las acciones que necesitamos del store.
  const { products, loading, error, fetchProducts, resetFiltersAndSort } = useProductStore();

  // Usamos useEffect para cargar los datos iniciales.
  useEffect(() => {
    // Primero, nos aseguramos de que no haya filtros o ordenamientos aplicados
    // de visitas anteriores a otras páginas.
    resetFiltersAndSort();
    // Luego, buscamos todos los productos.
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array de dependencias vacío [] es la clave.
          // Le dice a React que ejecute este efecto UNA SOLA VEZ,
          // cuando el componente se monta por primera vez, y nunca más.
          // Esto rompe el bucle de renderizado.

  return (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        
        {/* Mostramos un mensaje de carga mientras se obtienen los datos */}
        {loading && <div className="text-center p-10">Cargando productos...</div>}
        
        {/* Mostramos un mensaje de error si la carga falla */}
        {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}
        
        {/* Solo mostramos los productos si no estamos cargando y no hay errores */}
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

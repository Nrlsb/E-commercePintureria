// src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import HeroBanner from '../components/HeroBanner.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx'; // 1. Importar el componente de paginación
import { useProductStore } from '../stores/useProductStore.js';

const HomePage = () => {
  // 2. Obtener el estado de paginación del store
  const { products, loading, error, fetchProducts, resetFiltersAndSort, currentPage, totalPages } = useProductStore();

  useEffect(() => {
    resetFiltersAndSort();
    fetchProducts(null, 1); // Cargar la primera página al montar el componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Función para manejar el cambio de página
  const handlePageChange = (page) => {
    fetchProducts(null, page);
    window.scrollTo(0, 0); // Opcional: llevar al usuario al inicio de la página
  };

  return (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
        />

        {/* 4. Renderizar el componente de paginación */}
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

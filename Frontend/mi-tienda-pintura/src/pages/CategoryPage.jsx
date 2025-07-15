// src/pages/CategoryPage.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductFilters from '../components/ProductFilters.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx'; // 1. Importar
import { useProductStore } from '../stores/useProductStore.js';

const CategoryPage = () => {
  const { categoryName } = useParams();
  
  // 2. Obtener estado de paginación
  const { products, loading, error, fetchProducts, resetFiltersAndSort, currentPage, totalPages } = useProductStore();

  useEffect(() => {
    resetFiltersAndSort();
    fetchProducts(categoryName, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  // 3. Función para manejar el cambio de página
  const handlePageChange = (page) => {
    fetchProducts(categoryName, page);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Categoría: <span className="text-blue-600">{categoryName}</span></h1>
      
      <ProductFilters category={categoryName} />

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
    </div>
  );
};

export default CategoryPage;

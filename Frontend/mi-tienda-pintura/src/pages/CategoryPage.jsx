// src/pages/CategoryPage.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductFilters from '../components/ProductFilters.jsx';
import ProductGrid from '../components/ProductGrid.jsx'; // Se importa el nuevo componente
import { useProductStore } from '../stores/useProductStore.js';

const CategoryPage = () => {
  const { categoryName } = useParams();
  
  const { products, loading, error, fetchProducts, resetFiltersAndSort } = useProductStore();

  useEffect(() => {
    resetFiltersAndSort();
    fetchProducts(categoryName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Categoría: <span className="text-blue-600">{categoryName}</span></h1>
      
      <ProductFilters category={categoryName} />

      {/* Se usa el componente ProductGrid para renderizar la lista */}
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default CategoryPage;

// src/pages/CategoryPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { useProductStore } from '../stores/useProductStore.js'; // 1. Importamos el store

const CategoryPage = () => {
  const { categoryName } = useParams();
  // 2. Obtenemos la lista completa de productos desde el store
  const products = useProductStore(state => state.products);

  // 3. Filtramos la lista de productos obtenida del store
  const filteredProducts = products.filter(product => 
    product.category.toLowerCase() === categoryName.toLowerCase()
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Categoría: <span className="text-blue-600">{categoryName}</span></h1>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            // 4. Ya no pasamos onAddToCart como prop
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No hay productos en esta categoría</h2>
          <Link to="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Volver al inicio</Link>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;

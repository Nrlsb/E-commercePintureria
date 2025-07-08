// src/App.js
import React, { useState } from 'react';

// Importación de datos
import { mockProducts } from './data/products';

// Importación de componentes
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroBanner from './components/HeroBanner';
import ProductCard from './components/ProductCard';

// Componente principal que une toda la aplicación.
export default function App() {
  const [cartItemCount, setCartItemCount] = useState(0);
  
  // Simulación de navegación entre páginas
  const [currentPage, setCurrentPage] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAddToCart = (product) => {
    console.log(`Agregado al carrito: ${product.name}`);
    setCartItemCount(prevCount => prevCount + 1);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };
  
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setCurrentPage('productDetail');
  }

  // Renderiza la página principal
  const renderHomePage = () => (
    <>
      <HeroBanner />
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Los Más Buscados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProducts.map(product => (
            <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
                onProductClick={handleProductClick}
            />
          ))}
        </div>
      </section>
    </>
  );

  // --- PÁGINAS SIMULADAS ---
  // En una app real, esto se manejaría con una librería de ruteo como React Router.
  
  // Por ahora, no tenemos estas páginas, pero el sistema está listo.
  const renderProductDetailPage = () => <div>Página de Detalle para: {selectedProduct?.name}</div>;
  const renderCartPage = () => <div>Página del Carrito</div>;


  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header cartItemCount={cartItemCount} onNavigate={handleNavigate} />
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && renderHomePage()}
        {currentPage === 'productDetail' && renderProductDetailPage()}
        {currentPage === 'cart' && renderCartPage()}
      </main>

      <Footer />
    </div>
  );
}

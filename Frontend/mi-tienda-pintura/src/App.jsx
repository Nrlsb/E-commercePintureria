// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Importación de Componentes
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Notification from './components/Notification.jsx';

// Importación de Páginas
import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import SearchResultsPage from './pages/SearchResultsPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';

export default function App() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: '', show: false });
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. Nuevos estados para manejar los productos de la API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. useEffect para cargar los productos desde el backend al iniciar la app
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/products');
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor');
        }
        const data = await response.json();
        setProducts(data); // Guardamos los productos en el estado
      } catch (err) {
        setError(err.message); // Guardamos el error si algo falla
      } finally {
        setLoading(false); // Dejamos de cargar, ya sea con éxito o error
      }
    };

    fetchProducts();
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- Lógica del Carrito (sin cambios) ---
  const handleAddToCart = (product, quantity = 1) => {
    setCart(prevCart => {
        const existingProduct = prevCart.find(item => item.id === product.id);
        if (existingProduct) {
            return prevCart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
            );
        } else {
            return [...prevCart, { ...product, quantity }];
        }
    });
    setNotification({ message: `¡Añadido al carrito!`, show: true });
  };
  // ... (resto de funciones del carrito y navegación sin cambios) ...
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) { handleRemoveItem(productId); return; }
    setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };
  const handleRemoveItem = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  const handlePlaceOrder = () => {
    setCart([]);
    navigate('/success');
  }
  const handleSearch = (query) => {
    setSearchQuery(query);
    navigate('/search');
  };
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => { setNotification({ ...notification, show: false }); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // 3. Renderizado condicional mientras se cargan los datos
  if (loading) {
    return <div className="flex justify-center items-center h-screen text-2xl">Cargando productos...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-2xl text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col relative">
      <Header cartItemCount={cartItemCount} onSearch={handleSearch} />
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* 4. Pasamos la lista de productos a las páginas que la necesitan */}
          <Route path="/" element={<HomePage products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/product/:productId" element={<ProductDetailPage onAddToCart={handleAddToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} />} />
          <Route path="/checkout" element={<CheckoutPage cart={cart} onPlaceOrder={handlePlaceOrder} />} />
          <Route path="/success" element={<OrderSuccessPage />} />
          <Route path="/search" element={<SearchResultsPage products={products} query={searchQuery} onAddToCart={handleAddToCart} />} />
          <Route path="/category/:categoryName" element={<CategoryPage products={products} onAddToCart={handleAddToCart} />} />
        </Routes>
      </main>

      <Footer />
      <Notification message={notification.message} show={notification.show} />
    </div>
  );
}

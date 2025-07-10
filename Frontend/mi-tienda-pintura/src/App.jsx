// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';

// Importación de Componentes
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Notification from './components/Notification.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// Importación de Páginas
import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import SearchResultsPage from './pages/SearchResultsPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import ProductFormPage from './pages/ProductFormPage.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ¡IMPORTANTE! Reemplaza 'TU_PUBLIC_KEY' con tu clave pública real de Mercado Pago.
initMercadoPago('APP_USR-b2b31af4-7b53-466c-bf0b-430714909357', { locale: 'es-AR' });

// Función para decodificar el token JWT y obtener los datos del usuario
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: '', show: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? parseJwt(token) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleLoginSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

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

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prevCart => prevCart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handlePlaceOrder = () => {
    setCart([]);
    navigate('/success');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    navigate('/search');
  };

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-2xl">Cargando productos...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-2xl text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col relative">
      <Header cartItemCount={cartItemCount} onSearch={handleSearch} user={user} onLogout={handleLogout} />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<HomePage products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/product/:productId" element={<ProductDetailPage products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} />} />
          <Route path="/checkout" element={<CheckoutPage cart={cart} onPlaceOrder={handlePlaceOrder} />} />
          <Route path="/success" element={<OrderSuccessPage />} />
          <Route path="/search" element={<SearchResultsPage products={products} query={searchQuery} onAddToCart={handleAddToCart} />} />
          <Route path="/category/:categoryName" element={<CategoryPage products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas de Administración Protegidas */}
          <Route element={<AdminRoute user={user} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/product/new" element={<ProductFormPage />} />
            <Route path="/admin/product/edit/:productId" element={<ProductFormPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
      <Notification message={notification.message} show={notification.show} />
    </div>
  );
}

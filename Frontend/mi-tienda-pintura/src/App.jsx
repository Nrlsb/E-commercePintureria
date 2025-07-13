// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';

// Stores de Zustand
import { useProductStore } from './stores/useProductStore';
import { useNotificationStore } from './stores/useNotificationStore';

// Componentes y Páginas
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Notification from './components/Notification.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';

const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-AR' });
} else {
  console.error("Error: La Public Key de Mercado Pago no está configurada.");
}

export default function App() {
  // Obtenemos solo las acciones y estados que App necesita directamente.
  const fetchProducts = useProductStore(state => state.fetchProducts);
  const { message: notificationMessage, show: showNotification } = useNotificationStore();

  // Cargamos los productos una sola vez al iniciar la aplicación.
  // Las páginas individuales se encargarán de mostrar sus propios estados de carga.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // **CORRECCIÓN CLAVE**: Se elimina el return condicional para `loading` y `error`.
  // La estructura principal de la app siempre se renderiza.
  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col relative">
      <Header />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/success" element={<OrderSuccessPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/my-orders" element={<OrderHistoryPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/product/new" element={<ProductFormPage />} />
            <Route path="/admin/product/edit/:productId" element={<ProductFormPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
      <Notification message={notificationMessage} show={showNotification} />
    </div>
  );
}

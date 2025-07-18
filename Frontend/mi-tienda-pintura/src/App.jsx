// src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';

import { useProductStore } from './stores/useProductStore';
import { useNotificationStore } from './stores/useNotificationStore';

// Componentes principales que se cargan de inmediato
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Notification from './components/Notification.jsx';
import Spinner from './components/Spinner.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// --- IMPLEMENTACIÓN DE LAZY LOADING ---
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage.jsx'));
const OrderPendingPage = lazy(() => import('./pages/OrderPendingPage.jsx'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'));
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage.jsx'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage.jsx')); // <-- AÑADIDO


const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-AR' });
} else {
  console.error("Error: La Public Key de Mercado Pago no está configurada.");
}

export default function App() {
  // Se elimina la llamada a fetchProducts de aquí.
  const fetchAvailableBrands = useProductStore(state => state.fetchAvailableBrands);
  const { message: notificationMessage, show: showNotification, type: notificationType } = useNotificationStore();

  useEffect(() => {
    // La responsabilidad de cargar los productos ahora recae en cada página (HomePage, CategoryPage, etc.)
    // Mantenemos la carga de las marcas aquí, ya que es un dato más global.
    fetchAvailableBrands();
  }, [fetchAvailableBrands]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col relative">
      <Header />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Suspense fallback={
            <div className="flex-grow flex items-center justify-center">
              <Spinner className="w-12 h-12 text-[#0F3460]" />
            </div>
          }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/success" element={<OrderSuccessPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-orders" element={<OrderHistoryPage />} />
              <Route path="/order-pending/:orderId" element={<OrderPendingPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/product/new" element={<ProductFormPage />} />
              <Route path="/admin/product/edit/:productId" element={<ProductFormPage />} />
              <Route path="/admin/product/bulk-upload" element={<BulkUploadPage />} /> {/* <-- AÑADIDO */}
            </Route>
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Notification message={notificationMessage} show={showNotification} type={notificationType} />
    </div>
  );
}

// Frontend/mi-tienda-pintura/src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useProductStore } from './stores/useProductStore';
import { useNotificationStore } from './stores/useNotificationStore';
import { initializeCsrf } from './api/api';

// Componentes principales
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Notification from './components/Notification.jsx';
import Spinner from './components/Spinner.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import QuickViewModal from './components/QuickViewModal.jsx';
import Chatbot from './components/Chatbot.jsx';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Lazy Loading de Páginas
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage.jsx'));
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
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage.jsx'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage.jsx'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage.jsx'));
const BulkCreateAIPage = lazy(() => import('./pages/BulkCreateAIPage.jsx'));
const BulkAssociateAIPage = lazy(() => import('./pages/BulkAssociateAIPage.jsx'));
const BulkGenerateAIDescriptionsPage = lazy(() => import('./pages/BulkGenerateAIDescriptionsPage.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const AdminCouponsPage = lazy(() => import('./pages/AdminCouponsPage.jsx'));
const AdminWebhookEventsPage = lazy(() => import('./pages/AdminWebhookEventsPage.jsx'));
const TrackingPage = lazy(() => import('./pages/TrackingPage.jsx')); // NUEVA RUTA
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage.jsx'));


const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-AR' });
} else {
  console.error("Error: La Public Key de Mercado Pago no está configurada.");
}

export default function App() {
  const { fetchAvailableBrands, quickViewProduct, closeQuickView } = useProductStore(state => ({
      fetchAvailableBrands: state.fetchAvailableBrands,
      quickViewProduct: state.quickViewProduct,
      closeQuickView: state.closeQuickView,
  }));
  const { message: notificationMessage, show: showNotification, type: notificationType } = useNotificationStore();
  const location = useLocation();

  useEffect(() => {
    initializeCsrf();
    fetchAvailableBrands();
  }, [fetchAvailableBrands]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col relative">
      <Header />
      <Navbar />
      <ScrollToTop />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col"
      >
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
            
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-orders" element={<OrderHistoryPage />} />
              <Route path="/order-pending/:orderId" element={<OrderPendingPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/track/:trackingNumber" element={<TrackingPage />} /> {/* NUEVA RUTA */}
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              <Route path="/admin/product/new" element={<ProductFormPage />} />
              <Route path="/admin/product/edit/:productId" element={<ProductFormPage />} />
              <Route path="/admin/product/bulk-upload" element={<BulkUploadPage />} />
              <Route path="/admin/product/bulk-create-ai" element={<BulkCreateAIPage />} />
              <Route path="/admin/product/bulk-associate-ai" element={<BulkAssociateAIPage />} />
              <Route path="/admin/product/bulk-generate-descriptions" element={<BulkGenerateAIDescriptionsPage />} />
              <Route path="/admin/webhooks" element={<AdminWebhookEventsPage />} />
            </Route>

            <Route path="/error/500" element={<ServerErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </motion.main>
      <Footer />
      
      <Chatbot />
      
      <AnimatePresence>
        {quickViewProduct && (
          <QuickViewModal product={quickViewProduct} onClose={closeQuickView} />
        )}
        {showNotification && (
          <Notification message={notificationMessage} type={notificationType} />
        )}
      </AnimatePresence>
    </div>
  );
}

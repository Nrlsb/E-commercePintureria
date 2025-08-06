import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Componentes y Stores
import Header from './components/Header';
import Footer from './components/Footer';
import Notification from './components/Notification';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Spinner from './components/Spinner'; // Usaremos este spinner como fallback
import Chatbot from './components/Chatbot';
import { useAuthStore } from './stores/useAuthStore';

// --- Carga Adaptativa (Lazy Loading) de Páginas ---
// Cada página se importará dinámicamente solo cuando sea necesaria.
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'));
const OrderPendingPage = lazy(() => import('./pages/OrderPendingPage'));


// Páginas de Administración
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const AdminCouponsPage = lazy(() => import('./pages/AdminCouponsPage'));
const AdminWebhookEventsPage = lazy(() => import('./pages/AdminWebhookEventsPage'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'));
const BulkCreateAIPage = lazy(() => import('./pages/BulkCreateAIPage'));
const BulkAssociateAIPage = lazy(() => import('./pages/BulkAssociateAIPage'));
const BulkGenerateAIDescriptionsPage = lazy(() => import('./pages/BulkGenerateAIDescriptionsPage'));


function App() {
  const { user } = useAuthStore();

  return (
    // Se eliminó el componente <Router> de aquí
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <Notification />
      <main className="flex-grow">
        {/* Suspense provee una UI de fallback mientras los componentes lazy se cargan */}
        <Suspense fallback={
          <div className="flex justify-center items-center h-screen">
            <Spinner />
          </div>
        }>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/order/success" element={<OrderSuccessPage />} />
            <Route path="/order/pending" element={<OrderPendingPage />} />
            <Route path="/server-error" element={<ServerErrorPage />} />

            {/* Rutas Protegidas para Usuarios Autenticados */}
            <Route path="/profile" element={<ProtectedRoute element={ProfilePage} />} />
            <Route path="/checkout" element={<ProtectedRoute element={CheckoutPage} />} />
            <Route path="/orders" element={<ProtectedRoute element={OrderHistoryPage} />} />
            <Route path="/wishlist" element={<ProtectedRoute element={WishlistPage} />} />

            {/* Rutas Protegidas para Administradores */}
            <Route path="/admin/dashboard" element={<AdminRoute element={AdminDashboardPage} />} />
            <Route path="/admin/products" element={<AdminRoute element={AdminProductsPage} />} />
            <Route path="/admin/product/new" element={<AdminRoute element={ProductFormPage} />} />
            <Route path="/admin/product/edit/:id" element={<AdminRoute element={ProductFormPage} />} />
            <Route path="/admin/orders" element={<AdminRoute element={AdminOrdersPage} />} />
            <Route path="/admin/coupons" element={<AdminRoute element={AdminCouponsPage} />} />
            <Route path="/admin/webhooks" element={<AdminRoute element={AdminWebhookEventsPage} />} />
            <Route path="/admin/bulk-upload" element={<AdminRoute element={BulkUploadPage} />} />
            <Route path="/admin/bulk-create-ai" element={<AdminRoute element={BulkCreateAIPage} />} />
            <Route path="/admin/bulk-associate-ai" element={<AdminRoute element={BulkAssociateAIPage} />} />
            <Route path="/admin/bulk-generate-ai-descriptions" element={<AdminRoute element={BulkGenerateAIDescriptionsPage} />} />

            {/* Ruta para página no encontrada */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {user && <Chatbot />}
      <Footer />
    </div>
  );
}

export default App;

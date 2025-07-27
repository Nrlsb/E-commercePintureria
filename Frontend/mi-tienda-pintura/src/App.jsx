// Frontend/mi-tienda-pintura/src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useProductStore } from './stores/useProductStore';
import { useNotificationStore } from './stores/useNotificationStore';
import { useAuthStore } from './stores/useAuthStore'; // Importar useAuthStore

// Componentes principales
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Notification from './components/Notification.jsx';
import Spinner from './components/Spinner.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import QuickViewModal from './components/QuickViewModal.jsx';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Lazy Loading de Páginas
// Todos los componentes de página se importan de forma perezosa usando React.lazy()
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage.jsx'));
const OrderPendingPage = lazy(() => import('./pages/OrderPendingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));

// Páginas de Admin
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage.jsx'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage.jsx'));
const AdminCouponsPage = lazy(() => import('./pages/AdminCouponsPage.jsx'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage.jsx'));
const BulkCreateAIPage = lazy(() => import('./pages/BulkCreateAIPage.jsx'));
const BulkAssociateAIPage = lazy(() => import('./pages/BulkAssociateAIPage.jsx'));

// Configuración de Mercado Pago
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY, {
  locale: 'es-AR',
});

// Variable para controlar si el interceptor ya fue configurado
let isInterceptorSetup = false;

function App() {
  const location = useLocation();
  const showNotification = useNotificationStore((state) => state.showNotification);
  const { token, user, logout, refreshToken } = useAuthStore(); // Obtener token, user, logout y refreshToken del store

  // NUEVO: Configuración del interceptor de fetch para manejar el refresco de tokens
  useEffect(() => {
    if (!token || isInterceptorSetup) return; // Solo configurar una vez y si hay token

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      let [resource, options] = args;
      
      // Asegurarse de que las opciones existan
      options = options || {};
      options.headers = options.headers || {};

      // Añadir el token actual a la cabecera de autorización si no está ya presente
      if (token && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        let response = await originalFetch(resource, options);

        // Clonar la respuesta para poder leer el cuerpo varias veces si es necesario
        const clonedResponse = response.clone();

        // Si la respuesta es 403 y el token necesita refrescarse (marcado por el backend)
        // y la petición no es la de refresco de token en sí misma
        if (
          response.status === 403 &&
          user?.needsTokenRefresh &&
          resource !== `${API_URL}/api/auth/refresh-token`
        ) {
          console.warn("Token antiguo detectado, intentando refrescar...");
          const newToken = await refreshToken(); // Intentar refrescar el token

          if (newToken) {
            // Reintentar la petición original con el nuevo token
            options.headers['Authorization'] = `Bearer ${newToken}`;
            response = await originalFetch(resource, options); // Reintentar la petición
            console.log("Petición reintentada con nuevo token.");
            return response; // Devolver la respuesta de la petición reintentada
          } else {
            // Si el refresco falla, el refreshToken() ya maneja el logout.
            // No se necesita hacer nada más aquí, simplemente devolver la respuesta 403 original
            // o una nueva respuesta de error si se prefiere.
            console.error("No se pudo refrescar el token, devolviendo error original.");
            return clonedResponse; // Devolver la respuesta original (403)
          }
        }

        // Si la respuesta es 401 (Unauthorized) y no es la ruta de login/register/forgot/reset
        // y no es la ruta de refresco de token, forzar logout.
        // Esto captura casos donde el token es completamente inválido o expiró sin una clave anterior.
        if (
          response.status === 401 &&
          !resource.includes('/api/auth/login') &&
          !resource.includes('/api/auth/register') &&
          !resource.includes('/api/auth/forgot-password') &&
          !resource.includes('/api/auth/reset-password') &&
          !resource.includes('/api/auth/refresh-token')
        ) {
          console.error("Petición 401 no autorizada, forzando logout.");
          logout();
          showNotification('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
          // Puedes redirigir al login si lo deseas
          // navigate('/login'); 
        }

        return response; // Devolver la respuesta original si no se necesita refrescar
      } catch (error) {
        console.error("Error en el interceptor de fetch:", error);
        throw error; // Propagar el error
      }
    };

    isInterceptorSetup = true; // Marcar que el interceptor ya está configurado
    console.log("Interceptor de fetch configurado.");

    // Limpiar el interceptor al desmontar el componente
    return () => {
      window.fetch = originalFetch;
      isInterceptorSetup = false;
      console.log("Interceptor de fetch limpiado.");
    };
  }, [token, user, logout, refreshToken, showNotification]); // Dependencias del useEffect

  return (
    <div className="flex flex-col min-h-screen font-inter antialiased bg-gray-50">
      <Header />
      <Navbar />
      <main className="flex-grow">
        <Notification />
        <QuickViewModal />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner /></div>}>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/category/:categoryName" element={<CategoryPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/order-pending" element={<OrderPendingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Rutas Protegidas para Usuarios Autenticados */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/order-history" element={<OrderHistoryPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                </Route>

                {/* Rutas Protegidas para Administradores */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/admin/products/new" element={<ProductFormPage />} />
                  <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                  <Route path="/admin/coupons" element={<AdminCouponsPage />} />
                  <Route path="/admin/bulk-upload" element={<BulkUploadPage />} />
                  <Route path="/admin/bulk-create-ai" element={<BulkCreateAIPage />} />
                  <Route path="/admin/bulk-associate-ai" element={<BulkAssociateAIPage />} />
                </Route>

                {/* Ruta Catch-all para 404 */}
                <Route path="*" element={<h1 className="text-center text-2xl p-10">404 - Página no encontrada</h1>} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;

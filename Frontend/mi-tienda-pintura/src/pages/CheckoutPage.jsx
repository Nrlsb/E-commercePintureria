// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// --- 1. Importar CardPayment en lugar de Wallet ---
import { CardPayment } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CheckoutPage = () => {
  const { cart, shippingCost, postalCode } = useCartStore(state => ({
    cart: state.cart,
    shippingCost: state.shippingCost,
    postalCode: state.postalCode,
  }));
  const { user, token } = useAuthStore(state => ({ user: state.user, token: state.token }));
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingCost;

  // --- 2. Función para manejar el envío del formulario de pago ---
  const handlePayment = async (formData) => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/orders/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // Enviamos todos los datos requeridos por el backend
        body: JSON.stringify({ 
          ...formData, // Esto incluye token, issuer_id, etc. del brick
          cart,
          transaction_amount: total,
          payer: {
            ...formData.payer,
            email: user.email, // Usamos el email del usuario logueado
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'El pago fue rechazado.');
      }

      // Si el pago es exitoso, redirigimos
      navigate(`/success?order_id=${data.orderId}`);

    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const initialization = {
    amount: total,
    // Opcional: puedes añadir una preferencia para pre-cargar datos
    // preferenceId: '<PREFERENCE_ID>' 
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          {/* --- 3. Renderizar el brick de CardPayment --- */}
          <CardPayment
            initialization={initialization}
            onSubmit={handlePayment}
            onReady={() => console.log('Brick de tarjeta listo')}
            onError={(err) => console.error('Error en el brick:', err)}
          />
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          {isProcessing && (
            <div className="flex justify-center items-center mt-4">
              <Spinner className="w-8 h-8 text-[#0F3460] mr-2" />
              <span>Procesando tu pago...</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Tu Pedido</h2>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md mr-3" />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span>${new Intl.NumberFormat('es-AR').format(subtotal)}</span>
              </div>
               <div className="flex justify-between text-lg">
                <span>Envío a {postalCode}</span>
                <span>${new Intl.NumberFormat('es-AR').format(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-2xl">
                <span>Total</span>
                <span>${new Intl.NumberFormat('es-AR').format(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

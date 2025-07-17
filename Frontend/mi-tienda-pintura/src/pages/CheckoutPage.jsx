// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Payment } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const MIN_TRANSACTION_AMOUNT = 100;

const CheckoutPage = () => {
  const { cart, shippingCost, postalCode, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preferenceId, setPreferenceId] = useState(null);
  const navigate = useNavigate();

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  const handleCreatePreference = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/orders/create-payment-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cart, total, shippingCost, postalCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo generar el link de pago.');
      
      setPreferenceId(data.preferenceId);

    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const initialization = {
    amount: total,
    preferenceId: preferenceId,
  };
  
  // --- CORRECCIÓN CLAVE: Se elimina la personalización de 'paymentMethods' ---
  // Dejamos que el Brick muestre automáticamente los métodos de pago
  // disponibles en la preferencia creada en el backend.
  const customization = {
    visual: {
      style: {
        theme: 'bootstrap', // Puedes mantener otros estilos visuales
      },
    },
  };

  const handleOnSubmit = async ({ formData }) => {
    console.log("Pago enviado, esperando redirección o webhook...", formData);
    setIsProcessing(true);
  };
  
  const handleOnError = (err) => {
    console.error('Error en el Payment Brick:', err);
    showNotification('Ocurrió un error al procesar el pago.', 'error');
    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Resumen y Método de Pago</h2>
          
          {preferenceId ? (
            <div id="payment-brick-container">
              <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={handleOnSubmit}
                onError={handleOnError}
                onReady={() => setIsProcessing(false)}
              />
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-6">Revisa tu pedido y haz clic en "Continuar al Pago" para elegir cómo pagar de forma segura con Mercado Pago (tarjeta, saldo en cuenta o transferencia).</p>
              {total < MIN_TRANSACTION_AMOUNT && (
                 <div className="text-center p-4 my-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                   <p className="text-yellow-700">El total de tu compra debe ser de al menos ${MIN_TRANSACTION_AMOUNT} para continuar.</p>
                 </div>
              )}
              <button 
                onClick={handleCreatePreference} 
                disabled={isProcessing || total < MIN_TRANSACTION_AMOUNT}
                className="w-full mt-6 bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 flex items-center justify-center"
              >
                {isProcessing ? <Spinner /> : 'Continuar al Pago'}
              </button>
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Tu Pedido</h2>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center"><img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md mr-3" />
                    <div><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">Cant: {item.quantity}</p></div>
                  </div>
                  <p className="font-semibold">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg"><span>Subtotal</span><span>${new Intl.NumberFormat('es-AR').format(subtotal)}</span></div>
              <div className="flex justify-between text-lg"><span>Envío a {postalCode}</span><span>${new Intl.NumberFormat('es-AR').format(shippingCost)}</span></div>
              <div className="flex justify-between font-bold text-2xl"><span>Total</span><span>${new Intl.NumberFormat('es-AR').format(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

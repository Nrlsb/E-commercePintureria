// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        body: JSON.stringify({ 
          ...formData,
          cart,
          transaction_amount: total,
          payer: {
            ...formData.payer,
            email: user.email,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'El pago fue rechazado.');
      }

      navigate(`/success?order_id=${data.orderId}`);

    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CONFIGURACIÓN MEJORADA PARA EL BRICK ---
  const initialization = {
    amount: total,
    payer: {
      email: user?.email,
      // Asumiendo que el store de auth puede proveer estos datos
      // firstName: user?.firstName, 
      // lastName: user?.lastName,
    },
  };

  const customization = {
    visual: {
      style: {
        theme: 'bootstrap', // Opciones: 'default', 'dark', 'bootstrap', 'flat'
      },
    },
    paymentMethods: {
      maxInstallments: 6, // Limita el número máximo de cuotas a mostrar
    },
  };

  // --- MANEJADOR DE ERRORES MEJORADO ---
  const handleOnError = (err) => {
    console.error('Error en el brick de pago:', err);
    let friendlyMessage = 'Error en el formulario de pago. Por favor, revisa los datos ingresados.';
    if (err.message.includes('empty_installments') || err.message.includes('higher amount')) {
      friendlyMessage = 'No hay cuotas disponibles para este monto o tarjeta. El monto puede ser muy bajo.';
    }
    setError(friendlyMessage);
    showNotification(friendlyMessage, 'error');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          {/* --- BRICK DE PAGO CON CONFIGURACIÓN ACTUALIZADA --- */}
          <CardPayment
            initialization={initialization}
            customization={customization}
            onSubmit={handlePayment}
            onReady={() => console.log('Brick de tarjeta listo')}
            onError={handleOnError}
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

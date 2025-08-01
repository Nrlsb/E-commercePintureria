// Frontend/mi-tienda-pintura/src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { usePayment } from '../hooks/usePayment';
import Spinner from '../components/Spinner.jsx';
import { Link } from 'react-router-dom'; // Importar Link

const MIN_TRANSACTION_AMOUNT = 100;
const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-AR' });
}

const CheckoutPage = () => {
  const { cart, shippingCost, postalCode, discountAmount, appliedCoupon } = useCartStore(state => ({
    cart: state.cart,
    shippingCost: state.shippingCost,
    postalCode: state.postalCode,
    discountAmount: state.discountAmount,
    appliedCoupon: state.appliedCoupon,
  }));
  const { user } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [paymentMethod, setPaymentMethod] = useState('card_payment');
  const { isProcessing, error, submitCardPayment, submitPixPayment, setError } = usePayment();

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = (subtotal - discountAmount) + shippingCost;

  const initialization = { amount: total, payer: { email: user?.email } };
  const customization = {
    visual: { style: { theme: 'bootstrap' } },
    paymentMethods: { maxInstallments: 6 },
  };

  const handleOnError = (err) => {
    console.error('Error en el brick de pago:', err);
    let friendlyMessage = 'Error en el formulario de pago. Por favor, revisa los datos ingresados.';
    if (err.message?.includes('fields_setup_failed')) {
        friendlyMessage = 'No se pudo cargar el formulario de pago. Por favor, recarga la página.';
    } else if (err.message?.includes('empty_installments') || err.message?.includes('higher amount')) {
      friendlyMessage = 'No hay cuotas disponibles para este monto o tarjeta. El monto puede ser muy bajo.';
    }
    setError(friendlyMessage);
    showNotification(friendlyMessage, 'error');
  };
  
  const getCartItemImageUrl = (item) => {
    if (item.imageUrl && typeof item.imageUrl === 'object') {
      return item.imageUrl.small || item.imageUrl.medium;
    }
    return item.imageUrl || `https://placehold.co/100x100/cccccc/ffffff?text=Img`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Selecciona tu método de pago</h2>
          
          <div className="flex space-x-4 mb-8 border-b pb-6">
            <button onClick={() => setPaymentMethod('card_payment')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'card_payment' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Tarjeta o Saldo en cuenta
            </button>
            <button onClick={() => setPaymentMethod('pix_transfer')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'pix_transfer' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Transferencia / PIX
            </button>
          </div>

          {/* --- INICIO DE LA SOLUCIÓN --- */}
          {/* Ocultamos el contenedor en lugar de desmontarlo para mantener la estabilidad del Brick */}
          <div style={{ display: paymentMethod === 'card_payment' ? 'block' : 'none' }}>
            {total < MIN_TRANSACTION_AMOUNT ? (
              <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-xl font-semibold text-yellow-800">Monto mínimo no alcanzado</h3>
                <p className="text-yellow-700 mt-2">El total de tu compra debe ser de al menos ${MIN_TRANSACTION_AMOUNT} para pagar con este método.</p>
              </div>
            ) : (
              // La key se elimina para evitar re-montajes innecesarios
              <div>
                  <CardPayment 
                      initialization={initialization} 
                      customization={customization} 
                      onSubmit={submitCardPayment} 
                      onError={handleOnError} 
                  />
              </div>
            )}
          </div>
          {/* --- FIN DE LA SOLUCIÓN --- */}

          {paymentMethod === 'pix_transfer' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Pagar con Transferencia / PIX</h3>
              <p className="text-gray-600 mb-6">Al confirmar, te mostraremos los datos para que realices el pago desde tu home banking o billetera virtual. La confirmación es automática.</p>
              
              {!user?.dni ? (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p className="font-bold">DNI Requerido</p>
                  <p>Para continuar, por favor agrega tu DNI en tu perfil. Es un requisito de Mercado Pago para este método de pago.</p>
                  <Link to="/profile" className="font-bold underline hover:text-red-800">Ir a Mi Perfil</Link>
                </div>
              ) : null}

              <button 
                onClick={submitPixPayment} 
                disabled={isProcessing || !user?.dni}
                className="w-full mt-6 bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? <Spinner /> : 'Generar datos para el pago'}
              </button>
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          {isProcessing && (
            <div className="flex justify-center items-center mt-4"><Spinner className="w-8 h-8 text-[#0F3460] mr-2" /><span>Procesando...</span></div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Tu Pedido</h2>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <img src={getCartItemImageUrl(item)} alt={item.name} className="w-16 h-16 rounded-md mr-3" />
                    <div><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">Cant: {item.quantity}</p></div>
                  </div>
                  <p className="font-semibold">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg"><span>Subtotal</span><span>${new Intl.NumberFormat('es-AR').format(subtotal)}</span></div>
              {appliedCoupon && (
                <div className="flex justify-between text-lg text-green-600">
                  <span>Descuento ({appliedCoupon.code})</span>
                  <span>- ${new Intl.NumberFormat('es-AR').format(discountAmount)}</span>
                </div>
              )}
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

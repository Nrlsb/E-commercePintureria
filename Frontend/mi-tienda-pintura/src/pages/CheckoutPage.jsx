// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardPayment } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner.jsx';
import CopyButton from '../components/CopyButton.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const MIN_TRANSACTION_AMOUNT = 100;

const CheckoutPage = () => {
  const { cart, shippingCost, postalCode, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);
  
  const [paymentMethod, setPaymentMethod] = useState('mercado_pago');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  const handlePayment = async (formData) => {
    setIsProcessing(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/orders/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, cart, transaction_amount: total, payer: { ...formData.payer, email: user.email } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'El pago fue rechazado.');
      clearCart();
      navigate(`/success?order_id=${data.orderId}`);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    setIsProcessing(true);
    setError('');
    try {
        const response = await fetch(`${API_URL}/api/orders/bank-transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cart, total, shippingCost, postalCode }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'No se pudo crear la orden.');
        
        clearCart();
        navigate(`/order-pending/${data.orderId}`);
    } catch (err) {
        setError(err.message);
        showNotification(err.message, 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const initialization = { amount: total, payer: { email: user?.email } };
  const customization = {
    visual: { style: { theme: 'bootstrap' } },
    paymentMethods: { maxInstallments: 6, mercadoPago: ['wallet_purchase'] },
  };

  const handleOnError = (err) => {
    console.error('Error en el brick de pago:', err);
    let friendlyMessage = 'Error en el formulario de pago. Por favor, revisa los datos ingresados.';
    if (err.message?.includes('empty_installments') || err.message?.includes('higher amount')) {
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
          <h2 className="text-xl font-bold mb-4">Selecciona tu método de pago</h2>
          
          <div className="flex space-x-4 mb-8 border-b pb-6">
            <button onClick={() => setPaymentMethod('mercado_pago')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'mercado_pago' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Tarjeta o Saldo en cuenta
            </button>
            <button onClick={() => setPaymentMethod('bank_transfer')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'bank_transfer' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Transferencia Bancaria
            </button>
          </div>

          {paymentMethod === 'mercado_pago' && (
            <>
              {total >= MIN_TRANSACTION_AMOUNT ? (
                <CardPayment initialization={initialization} customization={customization} onSubmit={handlePayment} onReady={() => console.log('Brick de tarjeta listo')} onError={handleOnError} />
              ) : (
                <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-xl font-semibold text-yellow-800">Monto mínimo no alcanzado</h3>
                  <p className="text-yellow-700 mt-2">El total de tu compra debe ser de al menos ${MIN_TRANSACTION_AMOUNT} para pagar con este método.</p>
                </div>
              )}
            </>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Datos para la Transferencia</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-2 text-gray-800">
                <p><strong>Banco:</strong> Banco de la Plaza</p>
                <p><strong>Titular:</strong> Pinturerías Mercurio S.A.</p>
                <p><strong>CUIT:</strong> 30-12345678-9</p>
                <p className="flex items-center"><strong>CBU/CVU:</strong> 0001112223334445556667 <CopyButton textToCopy="0001112223334445556667" /></p>
                <p className="flex items-center"><strong>Alias:</strong> PINTU.MERCURIO.MP <CopyButton textToCopy="PINTU.MERCURIO.MP" /></p>
                <p className="font-bold text-lg mt-2">Monto a transferir: ${new Intl.NumberFormat('es-AR').format(total)}</p>
              </div>
              <p className="text-sm text-gray-600 mt-4">Al confirmar, tu orden quedará pendiente y recibirás un email con estas instrucciones. El stock de tus productos será reservado por 48 horas.</p>
              <button onClick={handleBankTransfer} disabled={isProcessing} className="w-full mt-6 bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400">
                {isProcessing ? <Spinner /> : 'Confirmar y Finalizar Compra'}
              </button>
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          {isProcessing && paymentMethod === 'mercado_pago' && (
            <div className="flex justify-center items-center mt-4"><Spinner className="w-8 h-8 text-[#0F3460] mr-2" /><span>Procesando tu pago...</span></div>
          )}
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

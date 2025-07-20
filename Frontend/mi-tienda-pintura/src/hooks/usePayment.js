// src/hooks/usePayment.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Hook personalizado para manejar la lógica de procesamiento de pagos.
 * Encapsula las llamadas a la API, el estado de carga y el manejo de errores.
 */
export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Obtenemos los datos y acciones necesarios de los stores de Zustand
  const { cart, shippingCost, postalCode, total, clearCart } = useCartStore(state => ({
    cart: state.cart,
    shippingCost: state.shippingCost,
    postalCode: state.postalCode,
    total: (state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0) - state.discountAmount) + state.shippingCost,
    clearCart: state.clearCart,
  }));
  const { user, token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);

  /**
   * Procesa un pago con tarjeta a través de Mercado Pago.
   * @param {object} formData - Los datos del formulario de pago tokenizados por el SDK de Mercado Pago.
   */
  const submitCardPayment = async (formData) => {
    setIsProcessing(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/orders/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          ...formData, 
          cart, 
          shippingCost,
          postalCode,
          transaction_amount: total, 
          payer: { ...formData.payer, email: user.email, firstName: user.firstName, lastName: user.lastName } 
        }),
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

  /**
   * Crea una orden para ser pagada mediante transferencia bancaria.
   */
  const submitBankTransfer = async () => {
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

  // El hook devuelve el estado y las funciones para que el componente las use.
  return { isProcessing, error, submitCardPayment, submitBankTransfer, setError };
};

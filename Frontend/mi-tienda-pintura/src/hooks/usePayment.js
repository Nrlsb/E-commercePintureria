// Frontend/mi-tienda-pintura/src/hooks/usePayment.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { cart, shippingCost, postalCode, discountAmount } = useCartStore(state => ({
    cart: state.cart,
    shippingCost: state.shippingCost,
    postalCode: state.postalCode,
    discountAmount: state.discountAmount,
  }));
  const { user, token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);

  const submitCardPayment = async (formData) => {
    setIsProcessing(true);
    setError('');
    try {
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const total = (subtotal - discountAmount) + shippingCost;
      
      const response = await fetchWithCsrf(`${API_URL}/api/orders/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          ...formData, 
          transaction_amount: total,
          cart, 
          shippingCost,
          postalCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'El pago fue rechazado.');
      
      navigate(`/success?order_id=${data.orderId}`);
      
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPixPayment = async () => {
    setIsProcessing(true);
    setError('');
    try {
        const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        const total = (subtotal - discountAmount) + shippingCost;

        const response = await fetchWithCsrf(`${API_URL}/api/orders/pix-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cart, total, shippingCost, postalCode }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'No se pudo crear la orden de pago.');
        
        navigate(`/order-pending/${data.orderId}`, { state: { paymentData: data.paymentData } });
    } catch (err) {
        setError(err.message);
        showNotification(err.message, 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  // --- NUEVA FUNCIÓN PARA PAYWAY ---
  const submitPaywayPayment = async (cardToken) => {
    setIsProcessing(true);
    setError('');
    try {
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const totalAmount = (subtotal - discountAmount) + shippingCost;

      const response = await fetchWithCsrf(`${API_URL}/api/orders/process-payway-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          token: cardToken,
          cart,
          totalAmount
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'El pago fue rechazado.');
      
      navigate(`/success?order_id=${data.orderId}`);
      
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  // --- FIN ---

  return { isProcessing, error, submitCardPayment, submitPixPayment, submitPaywayPayment, setError };
};

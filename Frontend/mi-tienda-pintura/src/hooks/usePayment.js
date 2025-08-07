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

  const { cart, shippingCost, postalCode, total, clearCart } = useCartStore(state => ({
    cart: state.cart,
    shippingCost: state.shippingCost,
    postalCode: state.postalCode,
    total: (state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0) - state.discountAmount) + state.shippingCost,
    clearCart: state.clearCart,
  }));
  const { user, token } = useAuthStore();
  const showNotification = useNotificationStore(state => state.showNotification);

  const submitCardPayment = async (formData) => {
    setIsProcessing(true);
    setError('');
    try {
      const response = await fetchWithCsrf(`${API_URL}/api/orders/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          ...formData, 
          cart, 
          shippingCost,
          postalCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'El pago fue rechazado.');
      
      clearCart();
      // --- INICIO DE LA CORRECCIÓN ---
      // Se modifica la navegación para incluir el ID de la orden en la URL.
      // Esto asegura que se redirija correctamente a la página de éxito
      // y permite, opcionalmente, mostrar detalles específicos de la compra.
      navigate(`/success?order_id=${data.orderId}`);
      // --- FIN DE LA CORRECCIÓN ---
      
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

  return { isProcessing, error, submitCardPayment, submitPixPayment, setError };
};

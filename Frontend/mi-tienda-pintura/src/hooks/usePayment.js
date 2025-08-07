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

  // Se elimina `clearCart` de la desestructuración porque ya no se usará aquí.
  const { cart, shippingCost, postalCode, total } = useCartStore(state => ({
    cart: state.cart,
    shippingCost: state.shippingCost,
    postalCode: state.postalCode,
    total: (state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0) - state.discountAmount) + state.shippingCost,
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
      
      // --- CORRECCIÓN ---
      // La llamada a clearCart() se ha eliminado de aquí para evitar la redirección no deseada.
      // Ahora se llamará desde la página de éxito.
      
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

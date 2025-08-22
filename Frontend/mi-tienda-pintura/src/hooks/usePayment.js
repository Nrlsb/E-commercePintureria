// Frontend/mi-tienda-pintura/src/hooks/usePayment.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- NUEVA FUNCIÓN HELPER ---
// Esta función se encargará de llamar al endpoint de análisis de IA.
// La aislamos para poder reutilizarla fácilmente.
const triggerAIAnalysis = async (errorObject, token) => {
  try {
    // Simulamos un error de stack si no existe para darle más contexto a la IA
    const errorStack = errorObject.stack || (new Error(errorObject.message)).stack;

    const response = await fetch(`${API_URL}/api/debug/analyze-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        errorMessage: errorObject.toString(),
        errorStack: errorStack,
        componentStack: 'Error originado en el flujo de pago (usePayment hook).',
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo obtener el análisis del error desde el servidor.');
    }

    const data = await response.json();
    
    // Devolvemos el análisis para mostrarlo en un futuro modal si se quisiera.
    // Por ahora, lo mostraremos como una notificación avanzada.
    return data.analysis;

  } catch (err) {
    console.error("Error al obtener análisis de IA:", err);
    return 'No se pudo obtener el análisis de la IA. Revisa la consola para más detalles.';
  }
};


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

  const handleError = async (err) => {
    const errorMessage = err.message || 'Ocurrió un error desconocido.';
    setError(errorMessage);
    
    // --- LÓGICA DE ANÁLISIS DE IA ---
    if (user && user.role === 'admin') {
      showNotification('Error detectado. Analizando con IA...', 'info');
      const analysis = await triggerAIAnalysis(err, token);
      
      // Por ahora, mostraremos el análisis en una notificación más grande o en la consola.
      // En un futuro, esto podría abrir el AIErrorAnalysisModal.
      console.group("Análisis de Error por IA (Admin)");
      console.log(analysis);
      console.groupEnd();
      showNotification(`Análisis de IA: ${analysis.substring(0, 100)}... (ver consola para detalles)`, 'error');

    } else {
      showNotification(errorMessage, 'error');
    }
  };

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
      handleError(err); // Usamos nuestro nuevo manejador de errores
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
        handleError(err); // Usamos nuestro nuevo manejador de errores
    } finally {
        setIsProcessing(false);
    }
  };

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
      handleError(err); // Usamos nuestro nuevo manejador de errores
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, error, submitCardPayment, submitPixPayment, submitPaywayPayment, setError };
};

// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import Spinner from '../components/Spinner.jsx'; // Importar el Spinner

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CheckoutPage = () => {
  const cart = useCartStore(state => state.cart);
  const token = useAuthStore(state => state.token);

  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCreatePreference = async () => {
    // ... (lógica existente)
    setLoading(true);
    // ...
    try {
      const response = await fetch(`${API_URL}/api/orders/create-payment-preference`, {
        // ...
      });
      // ...
    } catch (err) {
      // ...
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... (resto del JSX) ... */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
          {/* ... (resumen del pedido) ... */}
          <div className="mt-6">
            {!preferenceId ? (
              <button 
                onClick={handleCreatePreference} 
                disabled={loading || cart.length === 0}
                className="w-full flex justify-center items-center bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 disabled:cursor-wait"
              >
                {loading ? <Spinner /> : 'Continuar al Pago'}
              </button>
            ) : (
              <Wallet initialization={{ preferenceId: preferenceId }} />
            )}
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
          {/* ... */}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

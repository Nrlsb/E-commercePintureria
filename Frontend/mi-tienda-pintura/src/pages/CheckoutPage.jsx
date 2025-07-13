// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore'; // 1. Importamos el store del carrito
import { useAuthStore } from '../stores/useAuthStore'; // 2. Importamos el store de autenticación

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CheckoutPage = () => {
  // 3. Obtenemos el estado directamente de los stores
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
    if (!token) {
        navigate('/login?redirect=/checkout');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });
      
      if (response.status === 403) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
        navigate('/login?redirect=/checkout');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Hubo un problema al generar el link de pago.' }));
        throw new Error(data.message);
      }

      const data = await response.json();
      setPreferenceId(data.id);
    } catch (err) {
      setError(err.message);
      console.error('Error al crear preferencia:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">1. Información de Contacto</h2>
              <input type="email" placeholder="Correo electrónico" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">2. Dirección de Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre" className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
                <input type="text" placeholder="Apellido" className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
                <input type="text" placeholder="Dirección" className="sm:col-span-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
                <input type="text" placeholder="Ciudad" className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
                <input type="text" placeholder="Código Postal" className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
              </div>
            </div>
          </div>
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
            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-2xl">
                <span>Total</span>
                <span>${new Intl.NumberFormat('es-AR').format(calculateTotal())}</span>
              </div>
            </div>

            <div className="mt-6">
              {!preferenceId ? (
                <button 
                  onClick={handleCreatePreference} 
                  disabled={loading || cart.length === 0}
                  className="w-full bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Procesando...' : 'Continuar al Pago'}
                </button>
              ) : (
                <Wallet initialization={{ preferenceId: preferenceId }} />
              )}
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </div>

            <Link to="/cart" className="block text-center w-full mt-4 text-[#0F3460] hover:underline font-medium">
              &larr; Volver al carrito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

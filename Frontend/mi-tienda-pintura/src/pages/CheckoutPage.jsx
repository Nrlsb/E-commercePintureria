// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// 1. Importar el componente Wallet de Mercado Pago
import { Wallet } from '@mercadopago/sdk-react';

// Definir la URL de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CheckoutPage = ({ cart }) => {
  // 2. Estados para manejar la preferencia de pago
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // 3. Función para crear la preferencia de pago en el backend
  const handleCreatePreference = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart }), // Enviamos el carrito completo
      });
      
      if (!response.ok) {
        throw new Error('Hubo un problema al generar el link de pago.');
      }

      const data = await response.json();
      setPreferenceId(data.id); // Guardamos el ID de la preferencia
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
      
      {/* Ya no usamos un <form> porque el pago se maneja con el SDK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Columna de Formulario (informativa por ahora) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-8">
            {/* Sección de Contacto */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">1. Información de Contacto</h2>
              <input type="email" placeholder="Correo electrónico" className="w-full p-3 border border-gray-300 rounded-md" required />
            </div>

            {/* Sección de Envío */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">2. Dirección de Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Apellido" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Dirección" className="sm:col-span-2 p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Ciudad" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Código Postal" className="p-3 border border-gray-300 rounded-md" required />
              </div>
            </div>
          </div>
        </div>

        {/* Columna de Resumen de Orden y Pago */}
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

            {/* 4. Lógica para mostrar el botón de pago */}
            <div className="mt-6">
              {!preferenceId ? (
                <button 
                  onClick={handleCreatePreference} 
                  disabled={loading || cart.length === 0}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Procesando...' : 'Continuar al Pago'}
                </button>
              ) : (
                // El componente Wallet se renderiza cuando tenemos un ID
                <Wallet initialization={{ preferenceId: preferenceId }} />
              )}
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </div>

            <Link to="/cart" className="block text-center w-full mt-4 text-blue-600 hover:underline">
              &larr; Volver al carrito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

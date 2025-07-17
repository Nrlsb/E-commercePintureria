// Frontend/mi-tienda-pintura/src/pages/CheckoutPage.jsx
// Este archivo ha sido modificado para implementar un único flujo de pago a través de Mercado Pago.
// Se ha corregido el error de importación de los stores de Zustand.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Corregimos la importación para que coincida con la exportación nombrada de los stores
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';

import Spinner from '../components/Spinner';

const CheckoutPage = () => {
  // Obtenemos los datos necesarios de nuestros stores de Zustand
  const { cart, total, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  // Estados para manejar la carga y los errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para la información de envío
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'Argentina',
  });

  // Manejador para actualizar el estado de la información de envío
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prevState => ({ ...prevState, [name]: value }));
  };

  /**
   * Manejador principal del pago.
   * Esta función se encarga de:
   * 1. Validar que los datos de envío estén completos.
   * 2. Llamar al backend para crear una preferencia de pago en Mercado Pago.
   * 3. Redirigir al usuario al checkout de Mercado Pago si la creación es exitosa.
   */
  const handlePayment = async () => {
    // Validación simple del formulario de envío
    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode) {
      setError('Por favor, completa todos los datos de envío para continuar.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Petición al backend para crear la orden de pago
      const response = await axios.post(
        // Usamos variables de entorno para la URL de la API
        `${import.meta.env.VITE_API_URL}/api/payments/create-order`,
        {
          items: cart.map(item => ({
            id: item._id,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            currency_id: 'ARS',
          })),
          shippingInfo, // Se pueden enviar los datos de envío al backend
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Enviamos el token de autenticación
          },
        }
      );

      // Si el backend responde con la URL de pago de Mercado Pago (init_point)...
      if (response.data.init_point) {
        // ...redirigimos al usuario a esa URL.
        window.location.href = response.data.init_point;
      } else {
        setError('No se pudo iniciar el proceso de pago. Inténtalo de nuevo.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating payment order:', err);
      setError('Hubo un error al procesar tu pago. Por favor, intenta más tarde.');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto mt-10 mb-20 p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Finalizar Compra</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna de Datos de Envío */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">1. Datos de Envío</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="address" className="block text-gray-700 font-medium mb-2">Dirección</label>
              <input
                type="text"
                id="address"
                name="address"
                value={shippingInfo.address}
                onChange={handleShippingChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="city" className="block text-gray-700 font-medium mb-2">Ciudad</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleShippingChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-gray-700 font-medium mb-2">Código Postal</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={shippingInfo.postalCode}
                  onChange={handleShippingChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </form>
          
          {/* SECCIÓN DE MÉTODO DE PAGO ELIMINADA */}
          {/* Ya no mostramos la selección de método de pago aquí. */}
          {/* Todo se manejará a través del checkout de Mercado Pago. */}
          <h2 className="text-2xl font-semibold mb-4 mt-8">2. Método de Pago</h2>
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 flex items-center">
            <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png" alt="Logo de Mercado Pago" className="h-8 mr-4"/>
            <p className="text-gray-700">Todos los pagos se procesan de forma segura a través de Mercado Pago.</p>
          </div>
        </div>

        {/* Columna de Resumen del Pedido */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-4">Resumen del Pedido</h2>
          <div>
            {cart.map(item => (
              <div key={item._id} className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-4" />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Cant: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between mb-2">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-semibold">${total.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-gray-600">Envío</p>
              {/* El costo de envío real debería calcularse e integrarse aquí */}
              <p className="font-semibold">A calcular</p>
            </div>
            <div className="flex justify-between text-xl font-bold mt-4">
              <p>Total</p>
              <p>${total.toFixed(2)}</p>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          <button
            onClick={handlePayment}
            disabled={loading || cart.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-6 hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
          >
            {loading ? <Spinner /> : 'Pagar Ahora'}
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">Serás redirigido a Mercado Pago para completar tu compra de forma segura.</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

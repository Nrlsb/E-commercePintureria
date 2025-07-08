// src/pages/CheckoutPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutPage = ({ cart, onPlaceOrder }) => {
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onPlaceOrder();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Columna de Formulario */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-8">
            {/* ESTA ES LA PARTE QUE FALTABA */}
            {/* Sección de Contacto */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Información de Contacto</h2>
              <input type="email" placeholder="Correo electrónico" className="w-full p-3 border border-gray-300 rounded-md" required />
            </div>

            {/* Sección de Envío */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Dirección de Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Apellido" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Dirección" className="sm:col-span-2 p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Ciudad" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Código Postal" className="p-3 border border-gray-300 rounded-md" required />
              </div>
            </div>

            {/* Sección de Pago */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Detalles de Pago</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Número de la tarjeta" className="sm:col-span-2 p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Nombre en la tarjeta" className="sm:col-span-2 p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Fecha de expiración (MM/AA)" className="p-3 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="CVC" className="p-3 border border-gray-300 rounded-md" required />
              </div>
            </div>
            {/* FIN DE LA PARTE QUE FALTABA */}
          </div>
        </div>

        {/* Columna de Resumen de Orden */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Tu Pedido</h2>
            {/* ESTA ES LA OTRA PARTE QUE FALTABA */}
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
            {/* FIN DE LA OTRA PARTE QUE FALTABA */}
            <button type="submit" className="w-full mt-6 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors">
              Pagar Ahora
            </button>
            <Link to="/cart" className="block text-center w-full mt-4 text-blue-600 hover:underline">
              &larr; Volver al carrito
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;

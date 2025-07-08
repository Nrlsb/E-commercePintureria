// src/pages/CartPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const CartPage = ({ cart, onUpdateQuantity, onRemoveItem }) => {
  
  const calculateSubtotal = (item) => item.price * item.quantity;
  const calculateTotal = () => cart.reduce((total, item) => total + calculateSubtotal(item), 0);

  if (cart.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-6">Parece que todavía no has añadido ningún producto. ¡Explora nuestra tienda!</p>
        <Link to="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          &larr; Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Carrito</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna de Items del Carrito */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            {/* ESTA ES LA PARTE QUE FALTABA */}
            {cart.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between border-b pb-6 last:border-b-0">
                <div className="flex items-center mb-4 sm:mb-0">
                  <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-md mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-gray-500">{item.brand}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-l-md">-</button>
                    <span className="px-4 py-1 text-lg">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-r-md">+</button>
                  </div>
                  <p className="font-bold text-lg w-28 text-right">${new Intl.NumberFormat('es-AR').format(calculateSubtotal(item))}</p>
                  <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {/* FIN DE LA PARTE QUE FALTABA */}
          </div>
        </div>

        {/* Columna de Resumen de Compra */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
                <h2 className="text-2xl font-bold border-b pb-4 mb-4">Resumen de Compra</h2>
                <div className="flex justify-between mb-4 text-lg">
                    <span>Subtotal</span>
                    <span>${new Intl.NumberFormat('es-AR').format(calculateTotal())}</span>
                </div>
                <div className="flex justify-between mb-6 text-lg">
                    <span>Envío</span>
                    <span>A calcular</span>
                </div>
                <div className="flex justify-between font-bold text-2xl border-t pt-4">
                    <span>Total</span>
                    <span>${new Intl.NumberFormat('es-AR').format(calculateTotal())}</span>
                </div>
                <Link to="/checkout" className="block text-center w-full mt-6 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors">
                    Finalizar Compra
                </Link>
                 <Link to="/" className="block text-center w-full mt-4 text-blue-600 hover:underline">
                    Seguir comprando
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

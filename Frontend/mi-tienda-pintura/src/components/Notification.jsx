// src/components/Notification.jsx
import React from 'react';

const Notification = ({ message, show }) => {
  // Usamos clases de Tailwind para el estilo y la animación.
  // La notificación se posiciona de forma fija en la esquina inferior derecha.
  // La transición se aplica a la propiedad 'transform' para moverla
  // hacia adentro y hacia afuera de la pantalla.
  return (
    <div
      className={`fixed bottom-5 right-5 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-lg transition-all duration-500 ease-in-out
                  ${show ? 'transform translate-x-0 opacity-100' : 'transform translate-x-[calc(100%+2rem)] opacity-0'}`}
    >
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Notification;

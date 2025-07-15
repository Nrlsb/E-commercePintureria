// src/components/Notification.jsx
import React from 'react';

// Objeto para centralizar los estilos de cada tipo de notificación
const notificationStyles = {
  success: {
    bg: 'bg-green-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const Notification = ({ message, show, type = 'success' }) => {
  // Se seleccionan los estilos basados en el 'type'
  const styles = notificationStyles[type] || notificationStyles.success;

  return (
    <div
      className={`fixed bottom-5 right-5 ${styles.bg} text-white py-3 px-6 rounded-lg shadow-xl transition-all duration-500 ease-in-out
                  ${show ? 'transform translate-x-0 opacity-100' : 'transform translate-x-[calc(100%+2rem)] opacity-0'}`}
    >
      <div className="flex items-center">
        {styles.icon}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Notification;

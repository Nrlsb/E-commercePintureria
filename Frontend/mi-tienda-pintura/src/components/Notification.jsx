// src/components/Notification.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Objeto para centralizar los estilos de cada tipo de notificación
const notificationStyles = {
  success: {
    bg: 'bg-green-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    ariaLive: 'polite', // Para mensajes no críticos que no requieren interrupción inmediata
  },
  error: {
    bg: 'bg-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    ariaLive: 'assertive', // Para errores importantes que requieren atención inmediata
  },
};

// Definir variantes para la animación
const notificationVariants = {
  hidden: {
    opacity: 0,
    x: "100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  }
};

const Notification = ({ message, type = 'success' }) => {
  const styles = notificationStyles[type] || notificationStyles.success;

  return (
    <motion.div
      variants={notificationVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={`fixed bottom-5 right-5 ${styles.bg} text-white py-3 px-6 rounded-lg shadow-xl`}
      role="status" // Indica que este es un mensaje de estado
      aria-live={styles.ariaLive} // Controla cómo los lectores de pantalla anuncian el contenido
    >
      <div className="flex items-center">
        {styles.icon}
        <span className="font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

export default Notification;

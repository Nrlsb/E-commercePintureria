// src/components/SessionExpiredModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/useAuthStore';
import Icon from './Icon';

/**
 * Modal que se muestra cuando la sesión del usuario ha expirado.
 * Proporciona un mensaje claro y una acción para redirigir al login.
 */
const SessionExpiredModal = () => {
  const navigate = useNavigate();
  // Se usa 'logout' para limpiar completamente el estado de autenticación.
  const logout = useAuthStore(state => state.logout);

  const handleLoginRedirect = () => {
    logout(); // Limpia cualquier estado de sesión residual.
    navigate('/login');
  };

  // Variantes de animación para el fondo y el modal.
  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { y: "-50px", opacity: 0, scale: 0.95 },
    visible: { y: "0", opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
        variants={modalVariants}
      >
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" className="h-6 w-6 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Sesión Expirada</h3>
          <p className="text-sm text-gray-600 mt-2">
            Tu sesión ha finalizado. Por favor, inicia sesión de nuevo para continuar.
          </p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-center rounded-b-lg">
          <button
            onClick={handleLoginRedirect}
            className="w-full px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionExpiredModal;

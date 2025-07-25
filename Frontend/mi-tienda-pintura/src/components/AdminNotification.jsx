// src/components/AdminNotification.jsx
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocketStore } from '../stores/useSocketStore';
import Icon from './Icon';

const ICONS = {
    new_order: "M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.48 10 10 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z",
    new_user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
};

const notificationConfig = {
    new_order: {
        title: 'Nueva Orden Recibida',
        icon: ICONS.new_order,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
    },
    new_user: {
        title: 'Nuevo Usuario Registrado',
        icon: ICONS.new_user,
        color: 'text-green-500',
        bgColor: 'bg-green-100',
    }
};

const SingleNotification = ({ notification, onDismiss }) => {
    const config = notificationConfig[notification.type] || {};

    // Auto-dismiss after 8 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 8000);

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
            // --- CAMBIOS DE ESTILO ---
            className="max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden relative"
        >
            <div className="p-5"> {/* Aumentamos el padding general */}
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className={`p-3 ${config.bgColor} rounded-full`}> {/* Aumentamos el padding del ícono */}
                            <Icon path={config.icon} className={`w-7 h-7 ${config.color}`} /> {/* Ícono más grande */}
                        </div>
                    </div>
                    <div className="ml-4 w-0 flex-1 pt-0.5"> {/* Aumentamos el margen */}
                        <p className="text-base font-bold text-gray-900"> {/* Título más grande y en negrita */}
                            {config.title}
                        </p>
                        <p className="mt-1 text-base text-gray-600"> {/* Mensaje más grande */}
                            {notification.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => onDismiss(notification.id)}
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {/* Barra de tiempo */}
            <motion.div
                className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-green-400" // Barra ligeramente más gruesa
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
            />
        </motion.div>
    );
};


const AdminNotification = () => {
  const { notifications, dismissNotification } = useSocketStore();

  return (
    <div className="fixed top-24 right-5 z-[100] space-y-4"> {/* Aumentamos el espacio entre notificaciones */}
      <AnimatePresence>
        {notifications.map((notif) => (
          <SingleNotification key={notif.id} notification={notif} onDismiss={dismissNotification} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotification;

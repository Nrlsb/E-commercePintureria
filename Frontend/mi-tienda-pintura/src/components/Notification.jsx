// src/components/Notification.jsx
import React from 'react';
import { motion } from 'framer-motion';

const notificationStyles = {
  success: {
    bg: 'bg-green-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    ariaLive: 'polite',
  },
  error: {
    bg: 'bg-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    ariaLive: 'assertive',
  },
};

const notificationVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.8,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
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
      className={`fixed bottom-5 right-5 ${styles.bg} text-white py-3 px-6 rounded-lg shadow-xl flex items-center`}
      role="status"
      aria-live={styles.ariaLive}
    >
      {styles.icon}
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

export default Notification;

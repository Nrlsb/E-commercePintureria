// src/stores/useSocketStore.js
import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useSocketStore = create((set, get) => ({
  socket: null,
  notifications: [],

  connect: (token) => {
    if (get().socket) return;

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO: Conectado al servidor.');
      set({ socket: newSocket });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO: Desconectado del servidor.');
      set({ socket: null });
    });

    const addNotification = (message, type) => {
        const newNotification = {
            id: Date.now() + Math.random(),
            message,
            type,
        };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
    };

    // --- CORRECCIÓN CLAVE ---
    // Ahora leemos la propiedad `message` del objeto `data` que envía el backend.
    newSocket.on('new_order', (data) => {
      addNotification(data.message, 'new_order');
    });

    newSocket.on('new_user', (data) => {
      const message = `Nuevo usuario registrado: ${data.email}`;
      addNotification(message, 'new_user');
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },
}));

// src/stores/useCartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Importamos el middleware
import { useNotificationStore } from './useNotificationStore';

export const useCartStore = create(
  // Envolvemos toda la lógica del store con `persist`.
  persist(
    (set, get) => ({
      cart: [],

      // Las acciones internas no cambian, `persist` funciona de forma transparente.
      addToCart: (product, quantity = 1) => {
        const { cart } = get();
        const showNotification = useNotificationStore.getState().showNotification;
        
        const itemInCart = cart.find(item => item.id === product.id);
        const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;

        if (currentQuantityInCart + quantity > product.stock) {
          showNotification(`No puedes añadir más. Stock máximo: ${product.stock}`);
          return;
        }

        set(state => {
          const existingProduct = state.cart.find(item => item.id === product.id);
          if (existingProduct) {
            return {
              cart: state.cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          } else {
            return { cart: [...state.cart, { ...product, quantity }] };
          }
        });
        showNotification('¡Añadido al carrito!');
      },

      updateQuantity: (productId, newQuantity) => {
        if (newQuantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set(state => ({
          cart: state.cart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
          ),
        }));
      },

      removeItem: (productId) => {
        set(state => ({
          cart: state.cart.filter(item => item.id !== productId),
        }));
      },

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'cart-storage', // Clave que se usará en localStorage para guardar el carrito.
    }
  )
);

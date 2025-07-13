// src/stores/useCartStore.js
import { create } from 'zustand';
import { useNotificationStore } from './useNotificationStore';

export const useCartStore = create((set, get) => ({
  cart: [],

  // Acción para añadir un producto al carrito
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

  // Acción para actualizar la cantidad de un producto
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

  // Acción para eliminar un producto del carrito
  removeItem: (productId) => {
    set(state => ({
      cart: state.cart.filter(item => item.id !== productId),
    }));
  },

  // Acción para vaciar el carrito
  clearCart: () => set({ cart: [] }),
}));

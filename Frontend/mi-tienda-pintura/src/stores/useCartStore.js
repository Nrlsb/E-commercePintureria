// src/stores/useCartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './useNotificationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      shippingCost: 0,
      postalCode: '',
      appliedCoupon: null,
      discountAmount: 0,

      addToCart: (product, quantity = 1) => {
        const { cart, postalCode } = get();
        const showNotification = useNotificationStore.getState().showNotification;
        
        const itemInCart = cart.find(item => item.id === product.id);
        const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;

        if (currentQuantityInCart + quantity > product.stock) {
          showNotification(`No puedes añadir más. Stock máximo: ${product.stock}`, 'error');
          return;
        }

        let updatedCart;
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
          updatedCart = cart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          updatedCart = [...cart, { ...product, quantity }];
        }
        
        set({ cart: updatedCart });
        get().recalculateDiscount();
        showNotification('¡Añadido al carrito!');

        if (postalCode) {
          get().calculateShipping(postalCode, updatedCart);
        }
      },

      updateQuantity: (productId, newQuantity) => {
        const { postalCode, cart } = get();
        let updatedCart;
        if (newQuantity <= 0) {
          updatedCart = cart.filter(item => item.id !== productId);
        } else {
          updatedCart = cart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
          );
        }
        set({ cart: updatedCart });
        get().recalculateDiscount();

        if (postalCode) {
          get().calculateShipping(postalCode, updatedCart);
        }
      },

      removeItem: (productId) => {
        const { postalCode, cart } = get();
        const updatedCart = cart.filter(item => item.id !== productId);
        set({ cart: updatedCart });
        get().recalculateDiscount();
        
        if (postalCode) {
          if (updatedCart.length > 0) {
            get().calculateShipping(postalCode, updatedCart);
          } else {
            set({ shippingCost: 0, postalCode: '' });
          }
        }
      },

      clearCart: () => set({ cart: [], shippingCost: 0, postalCode: '', appliedCoupon: null, discountAmount: 0 }),

      calculateShipping: async (postalCode, cartItems) => {
        if (!/^\d{4}$/.test(postalCode)) {
          set({ shippingCost: 0, postalCode: '' });
          return;
        }
        const items = cartItems || get().cart;
        if (items.length === 0) {
          set({ shippingCost: 0, postalCode: postalCode });
          return;
        }
        try {
          const response = await fetch(`${API_URL}/api/shipping/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postalCode, items }),
          });
          if (!response.ok) throw new Error('No se pudo calcular el envío.');
          const data = await response.json();
          set({ shippingCost: data.cost, postalCode: data.postalCode });
        } catch (error) {
          console.error("Error calculating shipping:", error);
          useNotificationStore.getState().showNotification('Error al calcular el envío.', 'error');
          set({ shippingCost: 0, postalCode: postalCode });
          throw error; // <-- MEJORA: Relanzar el error
        }
      },

      applyCoupon: async (code, token) => {
        const showNotification = useNotificationStore.getState().showNotification;
        try {
          const response = await fetch(`${API_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ code }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message);
          }
          set({ appliedCoupon: data.coupon });
          get().recalculateDiscount();
          showNotification(data.message, 'success');
        } catch (error) {
          set({ appliedCoupon: null, discountAmount: 0 });
          showNotification(error.message, 'error');
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, discountAmount: 0 });
        useNotificationStore.getState().showNotification('Cupón removido.', 'success');
      },

      recalculateDiscount: () => {
        const { cart, appliedCoupon } = get();
        if (!appliedCoupon) return;

        const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        let discount = 0;
        if (appliedCoupon.discountType === 'percentage') {
          discount = subtotal * (appliedCoupon.discountValue / 100);
        } else if (appliedCoupon.discountType === 'fixed') {
          discount = appliedCoupon.discountValue;
        }
        set({ discountAmount: Math.min(discount, subtotal) });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

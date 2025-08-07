// src/stores/useCartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './useNotificationStore';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      shippingCost: 0,
      postalCode: '',
      appliedCoupon: null,
      discountAmount: 0,

      setShippingCost: (cost) => set({ shippingCost: cost }),

      addToCart: (product, quantity = 1) => {
        const { cart, postalCode } = get();
        const showNotification = useNotificationStore.getState().showNotification;
        
        const itemInCart = cart.find(item => item.id === product.id);
        const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;

        if (currentQuantityInCart + quantity > product.stock) {
          showNotification(`No puedes añadir más. Stock máximo: ${product.stock}`, 'error');
          return;
        }

        // --- INICIO DE ACTUALIZACIÓN OPTIMISTA ---
        const previousCart = [...cart]; // 1. Guardar estado previo
        
        // 2. Actualizar UI inmediatamente
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

        // 3. Realizar operación asíncrona (si es necesario)
        if (postalCode) {
          (async () => {
            try {
              await get().calculateShipping(postalCode, updatedCart);
            } catch (error) {
              // 4. Revertir en caso de error
              console.error("Fallo en la actualización optimista (addToCart):", error);
              set({ cart: previousCart });
              get().recalculateDiscount();
              showNotification('Hubo un problema al actualizar el carrito.', 'error');
            }
          })();
        }
        // --- FIN DE ACTUALIZACIÓN OPTIMISTA ---
      },

      updateQuantity: (productId, newQuantity) => {
        const { postalCode, cart } = get();
        const showNotification = useNotificationStore.getState().showNotification;
        
        const product = cart.find(item => item.id === productId);
        if (product && newQuantity > product.stock) {
            showNotification(`No puedes añadir más. Stock máximo: ${product.stock}`, 'error');
            return;
        }

        // --- INICIO DE ACTUALIZACIÓN OPTIMISTA ---
        const previousCart = [...cart]; // 1. Guardar estado previo
        
        // 2. Actualizar UI inmediatamente
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

        // 3. Realizar operación asíncrona
        if (postalCode) {
          (async () => {
            try {
              await get().calculateShipping(postalCode, updatedCart);
            } catch (error) {
              // 4. Revertir en caso de error
              console.error("Fallo en la actualización optimista (updateQuantity):", error);
              set({ cart: previousCart });
              get().recalculateDiscount();
              showNotification('Hubo un problema al actualizar el carrito.', 'error');
            }
          })();
        }
        // --- FIN DE ACTUALIZACIÓN OPTIMISTA ---
      },

      removeItem: (productId) => {
        const { postalCode, cart } = get();
        // --- INICIO DE ACTUALIZACIÓN OPTIMISTA ---
        const previousCart = [...cart]; // 1. Guardar estado previo
        
        // 2. Actualizar UI inmediatamente
        const updatedCart = cart.filter(item => item.id !== productId);
        set({ cart: updatedCart });
        get().recalculateDiscount();
        
        // 3. Realizar operación asíncrona
        if (postalCode) {
          (async () => {
            try {
              if (updatedCart.length > 0) {
                await get().calculateShipping(postalCode, updatedCart);
              } else {
                set({ shippingCost: 0, postalCode: '' });
              }
            } catch (error) {
              // 4. Revertir en caso de error
              console.error("Fallo en la actualización optimista (removeItem):", error);
              set({ cart: previousCart });
              get().recalculateDiscount();
              useNotificationStore.getState().showNotification('Hubo un problema al eliminar el producto.', 'error');
            }
          })();
        }
        // --- FIN DE ACTUALIZACIÓN OPTIMISTA ---
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

        const sanitizedItems = items.map(item => ({
            ...item,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity, 10)
        }));

        try {
          const requestBody = { postalCode, items: sanitizedItems };
          const response = await fetchWithCsrf(`${API_URL}/api/shipping/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          if (!response.ok) throw new Error('No se pudo calcular el envío.');
          const data = await response.json();
          set({ shippingCost: data.cost, postalCode: data.postalCode });
        } catch (error) {
          console.error("Error calculating shipping:", error);
          useNotificationStore.getState().showNotification('Error al calcular el envío.', 'error');
          set({ shippingCost: 0, postalCode: postalCode });
          throw error;
        }
      },

      applyCoupon: async (code, token) => {
        const showNotification = useNotificationStore.getState().showNotification;
        const subtotal = get().cart.reduce((total, item) => total + item.price * item.quantity, 0);

        try {
          const response = await fetchWithCsrf(`${API_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ code, subtotal }),
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
        if (!appliedCoupon) {
            set({ discountAmount: 0 });
            return;
        }

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

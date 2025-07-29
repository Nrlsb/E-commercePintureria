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

      // --- MEJORA: OPTIMISTIC UI UPDATE ---
      addToCart: (product, quantity = 1) => {
        const { cart, postalCode } = get();
        const showNotification = useNotificationStore.getState().showNotification;
        
        const itemInCart = cart.find(item => item.id === product.id);
        const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;

        if (currentQuantityInCart + quantity > product.stock) {
          showNotification(`No puedes añadir más. Stock máximo: ${product.stock}`, 'error');
          return;
        }

        // 1. Guardar el estado anterior del carrito por si necesitamos revertir
        const previousCart = [...cart];

        // 2. Crear el nuevo estado del carrito
        let updatedCart;
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
          updatedCart = cart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          updatedCart = [...cart, { ...product, quantity }];
        }
        
        // 3. Actualizar la UI inmediatamente con el nuevo estado (actualización optimista)
        set({ cart: updatedCart });
        get().recalculateDiscount();
        showNotification('¡Añadido al carrito!');

        // 4. Realizar la operación asíncrona (recalcular envío)
        if (postalCode) {
          (async () => {
            try {
              await get().calculateShipping(postalCode, updatedCart);
            } catch (error) {
              // 5. Si la operación falla, revertir al estado anterior y notificar
              console.error("Fallo en la actualización optimista (addToCart):", error);
              set({ cart: previousCart });
              get().recalculateDiscount();
              showNotification('Hubo un problema al actualizar el carrito.', 'error');
            }
          })();
        }
      },

      // --- MEJORA: OPTIMISTIC UI UPDATE ---
      updateQuantity: (productId, newQuantity) => {
        const { postalCode, cart } = get();
        const showNotification = useNotificationStore.getState().showNotification;
        
        const product = cart.find(item => item.id === productId);
        if (product && newQuantity > product.stock) {
            showNotification(`No puedes añadir más. Stock máximo: ${product.stock}`, 'error');
            return;
        }

        // 1. Guardar el estado anterior
        const previousCart = [...cart];

        // 2. Crear el nuevo estado del carrito
        let updatedCart;
        if (newQuantity <= 0) {
          updatedCart = cart.filter(item => item.id !== productId);
        } else {
          updatedCart = cart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
          );
        }
        
        // 3. Actualizar la UI inmediatamente
        set({ cart: updatedCart });
        get().recalculateDiscount();

        // 4. Realizar la operación asíncrona
        if (postalCode) {
          (async () => {
            try {
              await get().calculateShipping(postalCode, updatedCart);
            } catch (error) {
              // 5. Si falla, revertir
              console.error("Fallo en la actualización optimista (updateQuantity):", error);
              set({ cart: previousCart });
              get().recalculateDiscount();
              showNotification('Hubo un problema al actualizar el carrito.', 'error');
            }
          })();
        }
      },

      // --- MEJORA: OPTIMISTIC UI UPDATE ---
      removeItem: (productId) => {
        const { postalCode, cart } = get();
        const showNotification = useNotificationStore.getState().showNotification;

        // 1. Guardar el estado anterior
        const previousCart = [...cart];
        
        // 2. Crear el nuevo estado y actualizar la UI inmediatamente
        const updatedCart = cart.filter(item => item.id !== productId);
        set({ cart: updatedCart });
        get().recalculateDiscount();
        
        // 3. Realizar la operación asíncrona
        if (postalCode) {
          (async () => {
            try {
              if (updatedCart.length > 0) {
                await get().calculateShipping(postalCode, updatedCart);
              } else {
                set({ shippingCost: 0, postalCode: '' });
              }
            } catch (error) {
              // 4. Si falla, revertir
              console.error("Fallo en la actualización optimista (removeItem):", error);
              set({ cart: previousCart });
              get().recalculateDiscount();
              showNotification('Hubo un problema al eliminar el producto.', 'error');
            }
          })();
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

        // --- CORRECCIÓN: Asegurarse de que price y quantity sean números ---
        const sanitizedItems = items.map(item => ({
            ...item,
            price: parseFloat(item.price), // Convertir a número
            quantity: parseInt(item.quantity, 10) // Convertir a número entero
        }));

        try {
          // Log the body being sent for debugging, now with pretty-print
          const requestBody = { postalCode, items: sanitizedItems }; // Usar los ítems sanitizados
          console.log('Sending shipping calculation request with body:', JSON.stringify(requestBody, null, 2)); // DEBUG LOG

          const response = await fetch(`${API_URL}/api/shipping/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody), // Usar el requestBody logeado
          });
          if (!response.ok) throw new Error('No se pudo calcular el envío.');
          const data = await response.json();
          set({ shippingCost: data.cost, postalCode: data.postalCode });
        } catch (error) {
          console.error("Error calculating shipping:", error);
          useNotificationStore.getState().showNotification('Error al calcular el envío.', 'error');
          set({ shippingCost: 0, postalCode: postalCode });
          // Lanzamos el error para que la actualización optimista pueda capturarlo
          throw error;
        }
      },

      applyCoupon: async (code, token) => {
        const showNotification = useNotificationStore.getState().showNotification;
        // Recalculate subtotal before applying coupon
        const subtotal = get().cart.reduce((total, item) => total + item.price * item.quantity, 0);

        try {
          const response = await fetch(`${API_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ code, subtotal }), // Pass subtotal for validation
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
            set({ discountAmount: 0 }); // Ensure discount is 0 if no coupon
            return;
        }

        const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        let discount = 0;
        if (appliedCoupon.discountType === 'percentage') {
          discount = subtotal * (appliedCoupon.discountValue / 100);
        } else if (appliedCoupon.discountType === 'fixed') {
          discount = appliedCoupon.discountValue;
        }
        // Ensure discount does not exceed subtotal
        set({ discountAmount: Math.min(discount, subtotal) });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Frontend/mi-tienda-pintura/src/stores/useWishlistStore.js
import { create } from 'zustand';
import { useNotificationStore } from './useNotificationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useWishlistStore = create((set, get) => ({
  wishlist: [],
  wishlistProductIds: new Set(),
  loading: false,

  fetchWishlist: async (token) => {
    if (!token) return;
    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo cargar la lista de deseos.');
      const data = await response.json();
      set({
        wishlist: data,
        wishlistProductIds: new Set(data.map(p => p.id)),
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      set({ loading: false });
    }
  },

  toggleWishlistItem: async (product, token) => {
    const { wishlist, wishlistProductIds } = get();
    const showNotification = useNotificationStore.getState().showNotification;
    const isInWishlist = wishlistProductIds.has(product.id);

    // Optimistic UI update
    const previousWishlist = [...wishlist];
    const previousIds = new Set(wishlistProductIds);

    if (isInWishlist) {
      const newWishlist = wishlist.filter(p => p.id !== product.id);
      const newIds = new Set(newWishlist.map(p => p.id));
      set({ wishlist: newWishlist, wishlistProductIds: newIds });
    } else {
      const newWishlist = [...wishlist, product];
      const newIds = new Set([...wishlistProductIds, product.id]);
      set({ wishlist: newWishlist, wishlistProductIds: newIds });
    }

    try {
      const url = `${API_URL}/api/wishlist${isInWishlist ? `/${product.id}` : ''}`;
      const method = isInWishlist ? 'DELETE' : 'POST';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      const body = isInWishlist ? null : JSON.stringify({ productId: product.id });

      const response = await fetch(url, { method, headers, body: body });
      
      if (!response.ok) {
        throw new Error('Error al actualizar la lista de deseos.');
      }
      
      const data = await response.json();
      showNotification(data.message, 'success');

    } catch (error) {
      // Revert on error
      set({ wishlist: previousWishlist, wishlistProductIds: previousIds });
      showNotification(error.message, 'error');
    }
  },

  clearWishlist: () => set({ wishlist: [], wishlistProductIds: new Set() }),
}));

// Frontend/mi-tienda-pintura/src/pages/WishlistPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useAuthStore } from '../stores/useAuthStore';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

const WishlistPage = () => {
  const { wishlist, loading, fetchWishlist } = useWishlistStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchWishlist(token);
    }
  }, [token, fetchWishlist]);

  if (loading) {
    return <div className="flex-grow flex items-center justify-center"><Spinner className="w-12 h-12 text-[#0F3460]" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Lista de Deseos</h1>
      {wishlist.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tu lista de deseos está vacía.</h2>
          <p className="text-gray-600 mb-6">Agrega los productos que te gustan para verlos aquí más tarde.</p>
          <Link to="/" className="bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a]">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;

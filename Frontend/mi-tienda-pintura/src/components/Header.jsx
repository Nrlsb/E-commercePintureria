// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useProductStore } from '../stores/useProductStore';

// --- Componente de Menú de Usuario para Escritorio (MODIFICADO) ---
const UserMenuDesktop = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleLogout = () => {
    logout();
    clearCart();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-gray-300 hover:text-white transition-colors">
        <Icon path={ICONS.user} />
        <span className="hidden md:block ml-2">Hola, {user.email.split('@')[0]}</span>
        <Icon path={ICONS.chevronDown} className="hidden md:block w-4 h-4 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
          {user.role === 'admin' && (
            <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Panel Admin
            </Link>
          )}
          <Link to="/my-orders" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mis Compras
          </Link>
          {/* --- AÑADIDO: Enlace a la Lista de Deseos --- */}
          <Link to="/wishlist" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mi Lista de Deseos
          </Link>
          <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">
            Salir
          </button>
        </div>
      )}
    </div>
  );
};


// --- Componente Principal del Header (con Debounce) ---
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { fetchProducts, setSearchQuery, searchQuery } = useProductStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (localQuery.trim() === '' && searchQuery !== '') {
        setSearchQuery('');
    }

    const timerId = setTimeout(() => {
      if (localQuery.trim() !== '' && localQuery !== searchQuery) {
        if (location.pathname === '/search') {
          setSearchQuery(localQuery.trim());
          fetchProducts(null, 1);
        }
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [localQuery, searchQuery, location.pathname, setSearchQuery, fetchProducts]);


  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = localQuery.trim();
    if (trimmedQuery) {
      setSearchQuery(trimmedQuery);
      fetchProducts(null, 1);
      navigate('/search');
      if (isMenuOpen) setIsMenuOpen(false);
    }
  };

  const { user, logout } = useAuthStore();
  const { cart, clearCart } = useCartStore();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  const handleMobileLinkClick = () => setIsMenuOpen(false);
  const handleMobileLogout = () => {
    logout();
    clearCart();
    handleMobileLinkClick();
    navigate('/');
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  return (
    <header className="bg-[#0F3460] text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl font-bold text-white" onClick={handleMobileLinkClick}>
            Pinturerías Mercurio
          </Link>

          <form onSubmit={handleSubmit} className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-lg">
              <input 
                type="search" 
                placeholder="Buscar productos, marcas y más..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="w-full py-2 pl-4 pr-10 text-gray-900 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </form>

          {/* Menú para Escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <UserMenuDesktop />
            ) : (
              <Link to="/login" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <Icon path={ICONS.user} />
                <span className="ml-2">Mi Cuenta</span>
              </Link>
            )}
            <div className="h-6 border-l border-gray-600"></div>
            <Link to="/cart" className="flex items-center text-gray-300 hover:text-white transition-colors relative">
              <Icon path={ICONS.shoppingCart} />
              <span className="ml-2">Carrito</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-[#E9D502] text-[#0F3460] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Botones para Móvil */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/cart" className="text-white relative">
              <Icon path={ICONS.shoppingCart} className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E9D502] text-[#0F3460] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Panel Lateral para Móvil (MODIFICADO) */}
      {isMenuOpen && (
        <div className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 transition-opacity duration-300`} onClick={() => setIsMenuOpen(false)}>
          <div className={`fixed top-0 right-0 w-4/5 max-w-sm h-full bg-[#0F3460] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex flex-col h-full">
              <button onClick={() => setIsMenuOpen(false)} className="self-end text-white mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <form onSubmit={handleSubmit} className="mb-8">
                <input type="search" placeholder="Buscar..." value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} className="w-full py-2 px-4 text-gray-900 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"/>
              </form>

              <nav className="flex flex-col space-y-4 text-lg text-gray-200">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-white font-semibold">Hola, {user.email.split('@')[0]}</div>
                    <hr className="border-gray-500"/>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Panel Admin</Link>
                    )}
                    <Link to="/my-orders" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mis Compras</Link>
                    {/* --- AÑADIDO: Enlace a la Lista de Deseos (móvil) --- */}
                    <Link to="/wishlist" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mi Lista de Deseos</Link>
                    <button onClick={handleMobileLogout} className="w-full text-left px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Salir</button>
                  </>
                ) : (
                  <Link to="/login" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mi Cuenta</Link>
                )}
              </nav>

              <div className="mt-auto text-center text-gray-400 text-sm">
                Pinturerías Mercurio &copy; 2024
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

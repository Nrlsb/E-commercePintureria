// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';

// --- Nuevo Sub-componente: UserMenu ---
const UserMenu = ({ user, onLogout, closeParentMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Cierra el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleLinkClick = () => {
    setIsOpen(false);
    if (closeParentMenu) closeParentMenu();
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
            <Link to="/admin" onClick={handleLinkClick} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Panel Admin
            </Link>
          )}
          <Link to="/my-orders" onClick={handleLinkClick} className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mis Compras
          </Link>
          <button onClick={() => { onLogout(); handleLinkClick(); }} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">
            Salir
          </button>
        </div>
      )}
    </div>
  );
};


// --- Componente Header Principal ---
const Header = ({ cartItemCount, onSearch, user, onLogout }) => {
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  return (
    <header className="bg-[#0F3460] text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>
            Pinturerías Mercurio
          </Link>

          {/* Barra de Búsqueda para Escritorio */}
          <form onSubmit={handleSubmit} className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-lg">
              <input 
                type="search" 
                placeholder="Buscar productos, marcas y más..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-2 pl-4 pr-10 text-gray-900 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </form>

          {/* Iconos de Escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <UserMenu user={user} onLogout={onLogout} />
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

          {/* Iconos para la vista Móvil */}
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

      {/* Menú Lateral Deslizable (Overlay) */}
      {isMenuOpen && (
        <div className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 transition-opacity duration-300`} onClick={() => setIsMenuOpen(false)}>
          <div className={`fixed top-0 right-0 w-4/5 max-w-sm h-full bg-[#0F3460] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex flex-col h-full">
              <button onClick={() => setIsMenuOpen(false)} className="self-end text-white mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <form onSubmit={handleSubmit} className="mb-8">
                <input type="search" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full py-2 px-4 text-gray-900 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"/>
              </form>

              <nav className="flex flex-col space-y-4 text-lg">
                {user ? (
                   <UserMenu user={user} onLogout={onLogout} closeParentMenu={() => setIsMenuOpen(false)} />
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="hover:text-[#E9D502]">Mi Cuenta</Link>
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

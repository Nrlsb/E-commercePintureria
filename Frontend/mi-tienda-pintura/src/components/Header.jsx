// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';

const Header = ({ cartItemCount, onSearch, user, onLogout }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    // CAMBIO: Fondo con el azul del logo y sombra más pronunciada.
    <header className="bg-[#0F3460] text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* CAMBIO: Texto del logo en blanco para contraste. */}
          <Link to="/" className="text-2xl font-bold text-white">
            Pinturerías Mercurio
          </Link>

          {/* CAMBIO: Barra de búsqueda con colores que combinan. */}
          <form onSubmit={handleSubmit} className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-lg">
              <input 
                type="search" 
                placeholder="Buscar productos, marcas y más..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                // CAMBIO: Estilo del input.
                className="w-full py-2 pl-4 pr-10 text-gray-900 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </form>

          {/* CAMBIO: Iconos y textos con nuevos colores. */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-300 hidden md:inline">Hola, {user.email.split('@')[0]}</span>
                <button onClick={onLogout} className="text-gray-300 hover:text-white font-semibold transition-colors">
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center text-gray-300 hover:text-white transition-colors">
                <Icon path={ICONS.user} />
                <span className="ml-2">Mi Cuenta</span>
              </Link>
            )}
            <div className="h-6 border-l border-gray-600 hidden sm:block"></div>
            <Link to="/cart" className="flex items-center text-gray-300 hover:text-white transition-colors relative">
              <Icon path={ICONS.shoppingCart} />
              <span className="ml-2">Carrito</span>
              {cartItemCount > 0 && (
                // CAMBIO: Badge del carrito con el color de acento amarillo.
                <span className="absolute -top-2 -right-3 bg-[#E9D502] text-[#0F3460] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

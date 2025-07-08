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
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo (Restaurado) */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Pinturerías Mercurio
          </Link>

          {/* Barra de Búsqueda (Restaurada) */}
          <form onSubmit={handleSubmit} className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-lg">
              <input 
                type="search" 
                placeholder="Buscar productos, marcas y más..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-2 pl-4 pr-10 text-gray-700 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </form>

          {/* Iconos de la Derecha (con lógica de autenticación) */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600 hidden md:inline">Hola, {user.email.split('@')[0]}</span>
                <button onClick={onLogout} className="text-gray-600 hover:text-blue-600 font-semibold">
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center text-gray-600 hover:text-blue-600">
                <Icon path={ICONS.user} />
                <span className="ml-2">Mi Cuenta</span>
              </Link>
            )}
            <div className="h-6 border-l border-gray-300 hidden sm:block"></div>
            <Link to="/cart" className="flex items-center text-gray-600 hover:text-blue-600 relative">
              <Icon path={ICONS.shoppingCart} />
              <span className="ml-2">Carrito</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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

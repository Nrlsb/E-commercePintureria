// src/components/Header.js
import React from 'react';
import Icon from './Icon';
import { ICONS } from '../data/icons';

// Componente para la cabecera del sitio.
const Header = ({ cartItemCount, onNavigate }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <a href="#" onClick={() => onNavigate('home')} className="text-2xl font-bold text-blue-600">
              Pinturerías Mercurio
            </a>
          </div>
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-lg">
              <input 
                type="search" 
                placeholder="Buscar productos, marcas y más..."
                className="w-full py-2 pl-4 pr-10 text-gray-700 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#" className="hidden sm:flex items-center text-gray-600 hover:text-blue-600">
              <Icon path={ICONS.mapPin} />
              <span className="ml-2">Sucursales</span>
            </a>
            <a href="#" className="hidden sm:flex items-center text-gray-600 hover:text-blue-600">
              <Icon path={ICONS.user} />
              <span className="ml-2">Mi Cuenta</span>
            </a>
            <a href="#" onClick={() => onNavigate('cart')} className="flex items-center text-gray-600 hover:text-blue-600 relative">
              <Icon path={ICONS.shoppingCart} />
              <span className="ml-2">Carrito</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

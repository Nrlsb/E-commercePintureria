// src/components/Header.jsx
import React, { useState } from 'react'; // 1. Importar useState
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';

// 2. Añadir la prop 'onSearch'
const Header = ({ cartItemCount, onSearch }) => {
  // 3. Crear estado para el campo de búsqueda
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue
    if (query.trim()) {
      onSearch(query.trim()); // Llama a la función de búsqueda de App.jsx
      setQuery(''); // Limpia el campo después de buscar
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Pinturerías Mercurio
          </Link>

          {/* 4. Convertir la barra de búsqueda en un formulario */}
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

          <div className="flex items-center space-x-6">
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

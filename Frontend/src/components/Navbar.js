// src/components/Navbar.js
import React from 'react';
import Icon from './Icon';
import { ICONS } from '../data/icons';

// Componente para la barra de navegación de categorías.
const Navbar = () => {
    const categories = [
        "Látex Interior", "Látex Exterior", "Impermeabilizantes", 
        "Esmaltes", "Madera", "Aerosoles", "Automotor", "Accesorios"
    ];
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-12">
          <ul className="flex space-x-6 overflow-x-auto py-2">
            {categories.map(category => (
              <li key={category} className="flex-shrink-0">
                <a href="#" className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200">
                  {category}
                  <Icon path={ICONS.chevronDown} className="w-4 h-4 ml-1 opacity-70" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

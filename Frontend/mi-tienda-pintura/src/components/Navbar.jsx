// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // 1. Importar Link
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';

const Navbar = () => {
    const categories = [
        "Interior", "Exterior", "Impermeabilizantes", 
        "Esmaltes", "Madera", "Aerosoles", "Automotor", "Accesorios"
    ];

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-12">
          <ul className="flex space-x-6 overflow-x-auto py-2">
            {categories.map(category => (
              <li key={category} className="flex-shrink-0">
                {/* 2. Reemplazar <a> por <Link> */}
                <Link 
                  to={`/category/${category}`} 
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
                >
                  {category}
                  <Icon path={ICONS.chevronDown} className="w-4 h-4 ml-1 opacity-70" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

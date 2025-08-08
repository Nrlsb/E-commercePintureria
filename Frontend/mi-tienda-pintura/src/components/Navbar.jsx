// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';

const Navbar = () => {
    const categories = [
        "Interior", "Exterior", "Impermeabilizantes", 
        "Esmaltes", "Madera", "Aerosoles", "Automotor", "Accesorios"
    ];

  return (
    // CAMBIO: Fondo blanco, sombra sutil y borde inferior para una separación limpia.
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-12">
          {/* CAMBIO: Estilo de los enlaces actualizado a la nueva paleta. */}
          <ul className="flex space-x-6 overflow-x-auto py-2">
            {categories.map(category => (
              <li key={category} className="flex-shrink-0 group">
                <Link 
                  to={`/category/${category}`} 
                  // CAMBIO: Nuevos colores y transiciones para el hover.
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-[#0F3460] transition-colors duration-200"
                >
                  <span>{category}</span>
                  {/* CAMBIO: El ícono también cambia de color con el hover. */}
                  <Icon path={ICONS.chevronDown} className="w-4 h-4 ml-1 text-gray-400 group-hover:text-[#0F3460] transition-colors" />
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

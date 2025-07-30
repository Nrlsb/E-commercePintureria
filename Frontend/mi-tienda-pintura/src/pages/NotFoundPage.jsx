// Frontend/mi-tienda-pintura/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner'; // Importar Spinner si es necesario para algún estado de carga futuro
import Icon from '../components/Icon'; // Importar Icon para un icono

const NotFoundPage = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          {/* Icono de exclamación o de página no encontrada */}
          <Icon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página No Encontrada</h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Link to="/" className="inline-block bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a] transition-colors">
          Volver a la Tienda
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

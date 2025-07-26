// src/components/HeroBanner/HeroBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// Eliminamos: import HeroBannerImg from '../../images/hero-banner.jpg';
// Ya no necesitamos importar la imagen porque la serviremos desde la carpeta 'public'.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const HeroBanner = () => {
  // 1. Obtenemos la URL del backend desde las variables de entorno.
  // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // 2. Asumiendo que la imagen hero-banner.jpg está en la carpeta public/images/
  // Para acceder a archivos en la carpeta 'public', se usa una ruta relativa a la raíz del servidor.
  const heroBannerPublicPath = '/images/hero-banner.jpg'; 

  return (
    <div className="container mx-auto my-8 rounded-xl overflow-hidden">
      <div className="relative w-full h-96 bg-gray-200 flex items-center justify-center">
        {/* Usamos la ruta pública directamente para la imagen */}
        <img 
          src={heroBannerPublicPath} 
          alt="Banner principal: La pintura completa la imagen que ahora estará en nuestro backend." 
          className="absolute inset-0 w-full h-full object-cover" 
          loading="lazy"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src='https://placehold.co/1200x400/cccccc/ffffff?text=Imagen+no+disponible'; 
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Renová Tu Hogar.</h1>
            <h2 className="text-xl md:text-2xl font-bold mb-4">Pintá Tus Sueños.</h2>
            <p className="text-lg text-gray-300 mb-6">Encontrá la mayor variedad de pinturas y accesorios con la mejor calidad y asesoramiento.</p>
            <Link 
              to="/category/interior" 
              className="inline-block bg-[#0F3460] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#1a4a8a] transition-all transform hover:scale-105"
              aria-label="Ver Productos de la categoría interior"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

// src/components/HeroBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// 1. Obtenemos la URL del backend desde las variables de entorno.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const HeroBanner = () => {
  // 2. Construimos la URL completa a la imagen que ahora estará en nuestro backend.
  // Asumimos que guardas la imagen en `backend/public/images/hero-banner.jpg`
  const heroImageUrl = `${API_URL}/images/hero-banner.jpg`;

  return (
    <div className="bg-[#0F3460] my-8 rounded-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center text-white h-80">
            <div className="text-center md:text-left md:w-1/2 p-8">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight">Renová tu Hogar,</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-[#E9D502] mb-4">Pintá tus Sueños.</h3>
                <p className="text-lg text-gray-300 mb-6">Encontrá la mayor variedad de pinturas y accesorios con la mejor calidad y asesoramiento.</p>
                <Link to="/category/Interior" className="bg-[#E9D502] text-[#0F3460] font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-105 inline-block">
                    Ver Productos
                </Link>
            </div>
            <div className="hidden md:block md:w-1/2 h-full">
              {/* 3. Usamos la nueva URL que apunta a nuestro servidor. */}
              <img 
                src={heroImageUrl} 
                alt="Paredes pintadas con colores vibrantes" 
                className="w-full h-full object-cover rounded-r-xl"
                // Añadimos un fallback por si la imagen no carga
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/900x400/0F3460/FFFFFF?text=Pinturerias+Mercurio'; }}
              />
            </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

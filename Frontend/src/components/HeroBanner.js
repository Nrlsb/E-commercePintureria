// src/components/HeroBanner.js
import React from 'react';

// Componente para el banner promocional principal.
const HeroBanner = () => {
  return (
    <div className="bg-blue-500 my-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center text-white h-64 md:h-80 rounded-lg bg-cover bg-center" style={{backgroundImage: "url('https://placehold.co/1200x400/3498db/ffffff?text=¡Ofertas+Imperdibles!')"}}>
            <div className="text-center bg-black bg-opacity-30 p-8 rounded-lg">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-2">30% OFF en Impermeabilizantes</h2>
                <p className="text-lg md:text-xl mb-4">¡Prepará tu casa para la lluvia y ahorrá!</p>
                <a href="#" className="bg-white text-blue-600 font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-transform transform hover:scale-105">
                    Ver Productos
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

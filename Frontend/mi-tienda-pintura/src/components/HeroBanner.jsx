// src/components/HeroBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HeroBanner = () => {
  return (
    // CAMBIO: Fondo con el azul del logo.
    <div className="bg-[#0F3460] my-8 rounded-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* CAMBIO: Diseño simplificado y corporativo. */}
        <div className="flex flex-col md:flex-row items-center text-white h-80">
            <div className="text-center md:text-left md:w-1/2 p-8">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight">Renová tu Hogar,</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-[#E9D502] mb-4">Pintá tus Sueños.</h3>
                <p className="text-lg text-gray-300 mb-6">Encontrá la mayor variedad de pinturas y accesorios con la mejor calidad y asesoramiento.</p>
                {/* CAMBIO: Botón de acción con el color de acento amarillo. */}
                <Link to="/category/Interior" className="bg-[#E9D502] text-[#0F3460] font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-105 inline-block">
                    Ver Productos
                </Link>
            </div>
            <div className="hidden md:block md:w-1/2 h-full">
              {/* Usamos una imagen genérica que puede ser reemplazada por una real. */}
              <img src="https://images.unsplash.com/photo-1599691879228-3d5b338b556b?q=80&w=1887&auto=format&fit=crop" alt="Paredes pintadas con colores vibrantes" className="w-full h-full object-cover rounded-r-xl"/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

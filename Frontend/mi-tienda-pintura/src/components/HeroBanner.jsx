// src/components/HeroBanner/HeroBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// Eliminamos: import HeroBannerImg from '../../images/hero-banner.jpg';
// Ya no necesitamos importar la imagen porque la serviremos desde la carpeta 'public'.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const HeroBanner = () => {
  // --- INICIO DE MEJORAS DE OPTIMIZACIÓN DE IMÁGENES ---
  // Para servir imágenes optimizadas y responsivas, deberías tener varias versiones
  // del hero banner (ej. small, medium, large) en formato WebP en tu carpeta public.
  // Aquí usamos rutas de ejemplo que deberías reemplazar con tus imágenes reales.
  const heroBannerOptimized = {
    small: '/images/hero-banner-small.webp', // Ejemplo: para pantallas pequeñas (ej. 640px)
    medium: '/images/hero-banner-medium.webp', // Ejemplo: para pantallas medianas (ej. 1024px)
    large: '/images/hero-banner-large.webp', // Ejemplo: para pantallas grandes (ej. 1920px)
    default: '/images/hero-banner.jpg', // Fallback si WebP no es soportado o no hay versiones optimizadas
  };
  // --- FIN DE MEJORAS DE OPTIMIZACIÓN DE IMÁGENES ---

  return (
    <div className="container mx-auto my-8 rounded-xl overflow-hidden">
      <div className="relative w-full h-96 bg-gray-200 flex items-center justify-center">
        {/*
          Usamos srcset para servir la imagen más adecuada según el tamaño de pantalla.
          El navegador elegirá la imagen del srcset basada en el atributo 'sizes'.
          Se recomienda convertir hero-banner.jpg a WebP y generar 2-3 tamaños diferentes.
        */}
        <img 
          src={heroBannerOptimized.default} // Fallback para navegadores antiguos o si no hay srcset
          srcSet={`${heroBannerOptimized.small} 640w,
                   ${heroBannerOptimized.medium} 1024w,
                   ${heroBannerOptimized.large} 1920w`}
          sizes="(max-width: 640px) 100vw,
                 (max-width: 1024px) 100vw,
                 100vw"
          alt="Banner principal: La pintura completa la imagen que ahora estará en nuestro backend." 
          className="absolute inset-0 w-full h-full object-cover" 
          loading="lazy"
          width="1920" // Ancho intrínseco de la imagen más grande
          height="400" // Alto intrínseco (ajusta según tu diseño)
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

// src/components/Footer.js
import React from 'react';

// Componente para el pie de página.
const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white mt-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4">Pinturerías Mercurio</h3>
                        <p className="text-gray-400">Desde 1985, ofreciendo color y soluciones para tus proyectos. Calidad y servicio en un solo lugar.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Categorías</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-white">Interior</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Exterior</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Accesorios</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Ofertas</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Atención al Cliente</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-white">Contacto</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Preguntas Frecuentes</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Cómo comprar</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Medios de Pago</h3>
                        <div className="flex space-x-2">
                            <div className="w-12 h-8 bg-gray-600 rounded-md flex items-center justify-center text-xs">Visa</div>
                            <div className="w-12 h-8 bg-gray-600 rounded-md flex items-center justify-center text-xs">Master</div>
                            <div className="w-12 h-8 bg-gray-600 rounded-md flex items-center justify-center text-xs">Amex</div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-500">
                    <p>&copy; 2024 Pinturerías Mercurio. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

// src/components/Pagination.jsx
import React from 'react';

/**
 * Componente reutilizable para la paginación.
 * @param {object} props
 * @param {number} props.currentPage - La página actual.
 * @param {number} props.totalPages - El número total de páginas.
 * @param {function(number): void} props.onPageChange - Función que se llama al cambiar de página.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // No se renderiza nada si solo hay una página o menos.
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Lógica para generar los números de página a mostrar.
  // (Esta es una versión simplificada, se puede hacer más compleja para rangos grandes)
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center items-center space-x-2 mt-12" aria-label="Paginación">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="px-4 py-2 text-gray-600 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Anterior
      </button>

      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-4 py-2 border rounded-md transition-colors ${
            currentPage === number
              ? 'bg-[#0F3460] text-white border-[#0F3460] font-bold'
              : 'text-gray-600 bg-white hover:bg-gray-100'
          }`}
          aria-current={currentPage === number ? 'page' : undefined}
        >
          {number}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-gray-600 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente
      </button>
    </nav>
  );
};

export default Pagination;

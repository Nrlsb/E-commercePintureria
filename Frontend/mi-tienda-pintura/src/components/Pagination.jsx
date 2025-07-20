// src/components/Pagination.jsx
import React from 'react';

// --- NUEVO: Hook personalizado para la lógica de paginación ---
const usePagination = ({ totalPages, siblingCount = 1, currentPage }) => {
  const DOTS = '...';

  const range = (start, end) => {
    let length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const paginationRange = React.useMemo(() => {
    // 1. Definimos cuántos items mostraremos en la paginación
    // (hermanos + primera página + última página + página actual + 2xDOTS)
    const totalPageNumbers = siblingCount + 5;

    // Caso 1: Si el número total de páginas es menor o igual a lo que mostraremos,
    // no necesitamos puntos suspensivos. Simplemente mostramos todos los números.
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    // 2. Calculamos los índices de los "hermanos" (páginas a la izquierda y derecha de la actual)
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // 3. Decidimos si necesitamos mostrar los puntos suspensivos
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Caso 2: No hay puntos suspensivos a la izquierda, pero sí a la derecha.
    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPages];
    }

    // Caso 3: No hay puntos suspensivos a la derecha, pero sí a la izquierda.
    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    // Caso 4: Hay puntos suspensivos en ambos lados.
    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
  }, [totalPages, siblingCount, currentPage]);

  return paginationRange || [];
};


const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const paginationRange = usePagination({ currentPage, totalPages });

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

  return (
    <nav className="flex justify-center items-center space-x-2 mt-12" aria-label="Paginación">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="px-4 py-2 text-gray-600 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Anterior
      </button>

      {paginationRange.map((pageNumber, index) => {
        // Si el item es '...', mostramos los puntos suspensivos
        if (pageNumber === '...') {
          return <span key={`dots-${index}`} className="px-4 py-2 text-gray-500">&#8230;</span>;
        }

        // Si es un número, mostramos el botón de la página
        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`px-4 py-2 border rounded-md transition-colors ${
              currentPage === pageNumber
                ? 'bg-[#0F3460] text-white border-[#0F3460] font-bold'
                : 'text-gray-600 bg-white hover:bg-gray-100'
            }`}
            aria-current={currentPage === pageNumber ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

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

// src/components/Spinner.jsx
import React from 'react';

/**
 * Un componente de spinner SVG simple para indicar estados de carga.
 * @param {object} props - Propiedades del componente.
 * @param {string} [props.className='w-5 h-5 text-white'] - Clases de Tailwind para estilizar el spinner.
 */
const Spinner = ({ className = 'w-5 h-5 text-white' }) => {
  return (
    <div role="status" aria-live="polite" aria-label="Cargando..."> {/* Contenedor para accesibilidad */}
      <svg
        className={`animate-spin ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        // aria-hidden="true" se puede usar si el texto "Cargando..." ya es suficiente para el lector de pantalla
        // y no queremos que el SVG sea leído directamente.
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {/* Texto oculto visualmente pero disponible para lectores de pantalla */}
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default Spinner;

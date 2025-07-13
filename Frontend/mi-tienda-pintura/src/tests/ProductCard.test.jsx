// src/tests/ProductCard.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';

// --- Mock de datos de un producto ---
const mockProduct = {
  id: 1,
  name: 'Pintura Látex Interior Blanca',
  brand: 'ColorMax',
  price: 18500,
  imageUrl: 'https://placehold.co/400x400/0F3460/white?text=Pintura',
  averageRating: 4,
  reviewCount: 12,
};

// --- Suite de pruebas para el componente ProductCard ---
describe('Componente ProductCard', () => {

  // Prueba para verificar que la información principal se renderiza
  it('debería renderizar el nombre, marca y precio del producto', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={() => {}} />
      </MemoryRouter>
    );

    // Verificamos que el nombre, la marca y el precio estén en el documento
    expect(screen.getByText('Pintura Látex Interior Blanca')).toBeInTheDocument();
    expect(screen.getByText('ColorMax')).toBeInTheDocument();
    // El precio se formatea, por lo que buscamos el número con separadores
    expect(screen.getByText('$18.500')).toBeInTheDocument();
  });

  // Prueba para verificar que la calificación por estrellas se muestra
  it('debería renderizar el componente de calificación por estrellas', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={() => {}} />
      </MemoryRouter>
    );

    // Verificamos que el contador de reseñas sea visible
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  // Prueba para simular el clic en el botón "Agregar al Carrito"
  it('debería llamar a la función onAddToCart cuando se hace clic en el botón', () => {
    const handleAddToCartMock = vi.fn(); // Creamos una función espía

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={handleAddToCartMock} />
      </MemoryRouter>
    );

    // Buscamos el botón por su texto
    const addButton = screen.getByRole('button', { name: /Agregar al Carrito/i });
    
    // Simulamos un clic en el botón
    fireEvent.click(addButton);

    // Verificamos que nuestra función mock fue llamada una vez
    expect(handleAddToCartMock).toHaveBeenCalledTimes(1);
    // Verificamos que fue llamada con el producto correcto como argumento
    expect(handleAddToCartMock).toHaveBeenCalledWith(mockProduct);
  });

  // Prueba para verificar que la imagen del producto tiene el enlace correcto
  it('debería tener un enlace a la página de detalle del producto', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={() => {}} />
      </MemoryRouter>
    );

    // La imagen está dentro de un enlace (<a>), lo buscamos por su rol y href
    const link = screen.getByRole('link', { name: /Imagen de Pintura Látex Interior Blanca/i });
    
    // Verificamos que el enlace apunte a la URL correcta
    expect(link).toHaveAttribute('href', '/product/1');
  });
});

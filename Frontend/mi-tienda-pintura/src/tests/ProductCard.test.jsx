import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useCartStore from '../stores/useCartStore';

describe('Componente ProductCard', () => {
  let mockAddToCart; // Declaramos la variable aquí

  const mockProduct = {
    id: 1,
    name: 'Látex Interior Mate',
    brand: 'Alba',
    price: 5500,
    image: 'url-a-la-imagen.jpg',
    average_rating: 4.5,
  };

  beforeEach(() => {
    // Reseteamos el store a su estado inicial
    useCartStore.setState(useCartStore.getInitialState(), true);
    // Creamos el "espía" sobre la función del store ya inicializado
    mockAddToCart = vi.spyOn(useCartStore.getState(), 'addToCart');
  });

  it('debería renderizar el nombre, marca y precio del producto', () => {
    render(<ProductCard product={mockProduct} />, { wrapper: BrowserRouter });
    expect(screen.getByText('Látex Interior Mate')).toBeInTheDocument();
    expect(screen.getByText('Alba')).toBeInTheDocument();
    expect(screen.getByText('$5,500.00')).toBeInTheDocument();
  });

  it('debería tener un enlace a la página de detalle del producto', () => {
    render(<ProductCard product={mockProduct} />, { wrapper: BrowserRouter });
    const productLink = screen.getByRole('link', { name: /látex interior mate/i });
    expect(productLink).toHaveAttribute('href', `/product/${mockProduct.id}`);
  });

  it('debería llamar a la función addToCart del store cuando se hace clic en el botón', () => {
    render(<ProductCard product={mockProduct} />, { wrapper: BrowserRouter });
    
    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});

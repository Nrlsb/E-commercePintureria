import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Header';
import useCartStore from '../stores/useCartStore';
import useAuthStore from '../stores/useAuthStore';
import useProductStore from '../stores/useProductStore';

describe('Componente Header', () => {
  const onSearchMock = vi.fn();

  // --- CORRECCIÓN CLAVE ---
  // Movemos la inicialización de estados aquí, dentro del beforeEach.
  beforeEach(() => {
    // Reseteamos los stores a su estado original antes de cada prueba.
    useCartStore.setState(useCartStore.getInitialState(), true);
    useAuthStore.setState(useAuthStore.getInitialState(), true);
    useProductStore.setState(useProductStore.getInitialState(), true);
    vi.clearAllMocks();
  });

  it('debería renderizar el título de la tienda', () => {
    render(<Header onSearch={onSearchMock} />, { wrapper: BrowserRouter });
    expect(screen.getByText(/Pinturerías Mercurio/i)).toBeInTheDocument();
  });

  it('no debería mostrar el contador del carrito cuando está vacío', () => {
    render(<Header onSearch={onSearchMock} />, { wrapper: BrowserRouter });
    const cartCounter = screen.queryByTestId('cart-counter');
    expect(cartCounter).not.toBeInTheDocument();
  });

  it('debería mostrar el contador del carrito cuando hay items', () => {
    useCartStore.setState({ cart: [{ id: 1, quantity: 5 }] });
    render(<Header onSearch={onSearchMock} />, { wrapper: BrowserRouter });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('debería mostrar "Mi Cuenta" cuando no hay un usuario logueado', () => {
    render(<Header onSearch={onSearchMock} />, { wrapper: BrowserRouter });
    expect(screen.getByText(/Mi Cuenta/i)).toBeInTheDocument();
  });

  it('debería mostrar el email del usuario cuando está logueado', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { email: 'test@example.com' },
    });
    render(<Header onSearch={onSearchMock} />, { wrapper: BrowserRouter });
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('debería llamar a la función onSearch y al store de productos al enviar el formulario', () => {
    const setSearchQueryMock = vi.fn();
    useProductStore.setState({ setSearchQuery: setSearchQueryMock });

    render(<Header onSearch={onSearchMock} />, { wrapper: BrowserRouter });
    
    const searchInput = screen.getByPlaceholderText(/Buscar productos, marcas y más.../i);
    const form = searchInput.closest('form');

    fireEvent.change(searchInput, { target: { value: 'latex' } });
    fireEvent.submit(form);

    expect(onSearchMock).toHaveBeenCalledWith('latex');
    expect(setSearchQueryMock).toHaveBeenCalledWith('latex');
  });
});

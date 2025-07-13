import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CartPage from '../pages/CartPage';
import useCartStore from '../stores/useCartStore';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a {...props} href={props.to}>{props.children}</a>,
  };
});

describe('Componente CartPage', () => {
  beforeEach(() => {
    // Reseteamos el store a su estado inicial antes de cada prueba.
    useCartStore.setState(useCartStore.getInitialState(), true);
    vi.clearAllMocks();
  });

  it('debería mostrar un mensaje cuando el carrito está vacío', () => {
    render(<CartPage />, { wrapper: BrowserRouter });
    expect(screen.getByRole('heading', { name: /tu carrito está vacío/i })).toBeInTheDocument();
  });

  describe('Cuando el carrito tiene productos', () => {
    const mockCartItems = [
      { id: 1, name: 'Pintura Blanca', price: 100, quantity: 2, image: 'url1' },
      { id: 2, name: 'Pintura Negra', price: 120, quantity: 1, image: 'url2' },
    ];
    
    let mockUpdateQuantity;
    let mockRemoveFromCart;

    beforeEach(() => {
      // Creamos los "espías" aquí, después de que el store se ha reseteado.
      mockUpdateQuantity = vi.spyOn(useCartStore.getState(), 'updateQuantity');
      mockRemoveFromCart = vi.spyOn(useCartStore.getState(), 'removeFromCart');

      // Seteamos el estado para este bloque de pruebas.
      useCartStore.setState({
        cart: mockCartItems,
        total: 320,
      });
    });

    it('debería renderizar los productos y el total correcto', () => {
      render(<CartPage />, { wrapper: BrowserRouter });
      expect(screen.getByText('Pintura Blanca')).toBeInTheDocument();
      expect(screen.getByText(/total: \$320\.00/i)).toBeInTheDocument();
    });

    it('debería llamar a updateQuantity al hacer clic en el botón de incrementar', () => {
      render(<CartPage />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getAllByRole('button', { name: '+' })[0]);
      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3);
    });

    it('debería llamar a updateQuantity al hacer clic en el botón de decrementar', () => {
      render(<CartPage />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getAllByRole('button', { name: '-' })[0]);
      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1);
    });

    it('debería llamar a removeFromCart al hacer clic en el botón de eliminar', () => {
      render(<CartPage />, { wrapper: BrowserRouter });
      fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);
      expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
    });
  });
});

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CartPage from '../pages/CartPage';
import useCartStore from '../stores/useCartStore';

vi.mock('../components/Notification', () => ({
  default: () => <div data-testid="notification" />,
}));

let initialCartState;

beforeAll(() => {
  initialCartState = useCartStore.getState();
});

describe('Componente CartPage', () => {
  beforeEach(() => {
    act(() => {
      useCartStore.setState(initialCartState, true);
    });
  });

  it('debería mostrar un mensaje cuando el carrito está vacío', () => {
    render(<CartPage />, { wrapper: MemoryRouter });
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  describe('Cuando el carrito tiene productos', () => {
    const mockCartItems = [
      { id: 1, name: 'Pintura Roja', price: 100, quantity: 2, image: 'url1' },
      { id: 2, name: 'Pintura Azul', price: 150, quantity: 1, image: 'url2' },
    ];
    
    const mockUpdateQuantity = vi.fn();
    const mockRemoveFromCart = vi.fn();

    beforeEach(() => {
      act(() => {
        useCartStore.setState({
          items: [...mockCartItems],
          total: 350,
          updateQuantity: mockUpdateQuantity,
          removeFromCart: mockRemoveFromCart,
        });
      });
    });

    it('debería renderizar los productos y el total correcto', () => {
      render(<CartPage />, { wrapper: MemoryRouter });
      expect(screen.getByText('Pintura Roja')).toBeInTheDocument();
      expect(screen.getByText('Pintura Azul')).toBeInTheDocument();
      expect(screen.getByText(/Total: \$350\.00/)).toBeInTheDocument();
    });

    it('debería llamar a updateQuantity al hacer clic en el botón de incrementar', () => {
      render(<CartPage />, { wrapper: MemoryRouter });
      fireEvent.click(screen.getAllByText('+')[0]);
      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3);
    });

    it('debería llamar a updateQuantity al hacer clic en el botón de decrementar', () => {
      render(<CartPage />, { wrapper: MemoryRouter });
      fireEvent.click(screen.getAllByText('-')[0]);
      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1);
    });

    it('debería llamar a removeFromCart al hacer clic en el botón de eliminar', () => {
      render(<CartPage />, { wrapper: MemoryRouter });
      fireEvent.click(screen.getAllByText('Eliminar')[0]);
      expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
    });
  });
});

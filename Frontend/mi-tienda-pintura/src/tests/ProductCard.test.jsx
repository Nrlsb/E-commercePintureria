import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useCartStore from '../stores/useCartStore';
import useNotificationStore from '../stores/useNotificationStore';

vi.mock('../components/StarRating', () => ({
  default: () => <div data-testid="star-rating" />,
}));

let initialCartState;
let initialNotificationState;

beforeAll(() => {
  initialCartState = useCartStore.getState();
  initialNotificationState = useNotificationStore.getState();
});

describe('Componente ProductCard', () => {
  const product = {
    id: 1,
    name: 'Pintura Acrílica Roja',
    brand: 'ColorMax',
    price: 12.99,
    image: 'url-a-la-imagen.jpg',
    avg_rating: 4.5,
  };

  beforeEach(() => {
    act(() => {
      useCartStore.setState(initialCartState, true);
      useNotificationStore.setState(initialNotificationState, true);
    });
  });

  it('debería renderizar el nombre, marca y precio del producto', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter });
    expect(screen.getByText('Pintura Acrílica Roja')).toBeInTheDocument();
    expect(screen.getByText('ColorMax')).toBeInTheDocument();
    expect(screen.getByText(/\$\s*12,99/)).toBeInTheDocument();
  });

  it('debería tener un enlace a la página de detalle del producto', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter });
    const linkElement = screen.getByRole('heading', { name: /Pintura Acrílica Roja/i }).closest('a');
    expect(linkElement).toHaveAttribute('href', '/product/1');
  });

  it('debería agregar el producto al store del carrito cuando se hace clic en el botón', () => {
    const notificationSpy = vi.spyOn(useNotificationStore.getState(), 'showNotification');
    render(<ProductCard product={product} />, { wrapper: MemoryRouter });

    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(addButton);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ ...product, quantity: 1 });
    expect(notificationSpy).toHaveBeenCalledWith('Producto agregado al carrito');

    notificationSpy.mockRestore();
  });
});

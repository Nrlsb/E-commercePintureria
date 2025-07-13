import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import useCartStore from '../stores/useCartStore';
import useAuthStore from '../stores/useAuthStore';
import useProductStore from '../stores/useProductStore';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

// Se declaran las variables para el estado inicial aquí
let initialCartState;
let initialAuthState;

// beforeAll se ejecuta UNA VEZ por archivo, después de que todo está cargado.
beforeAll(() => {
  initialCartState = useCartStore.getState();
  initialAuthState = useAuthStore.getState();
});

describe('Componente Header', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // beforeEach se ejecuta antes de CADA 'it'.
    // Reseteamos los stores a su estado original de forma segura.
    act(() => {
      useCartStore.setState(initialCartState, true);
      useAuthStore.setState(initialAuthState, true);
    });
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('debería renderizar el título de la tienda', () => {
    render(<Header />, { wrapper: MemoryRouter });
    expect(screen.getByText('Pinturerías Mercurio')).toBeInTheDocument();
  });

  it('no debería mostrar el contador del carrito cuando está vacío', () => {
    render(<Header />, { wrapper: MemoryRouter });
    expect(screen.queryByTestId('cart-count')).toBeNull();
  });

  it('debería mostrar el contador del carrito cuando hay items', () => {
    act(() => {
      useCartStore.setState({ items: [{ id: 1 }, { id: 2 }] });
    });
    render(<Header />, { wrapper: MemoryRouter });
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
  });

  it('debería mostrar "Mi Cuenta" cuando no hay un usuario logueado', () => {
    render(<Header />, { wrapper: MemoryRouter });
    expect(screen.getByText('Mi Cuenta')).toBeInTheDocument();
  });

  it('debería mostrar el email del usuario cuando está logueado', () => {
    act(() => {
      useAuthStore.setState({ user: { email: 'test@example.com' }, token: '123' });
    });
    render(<Header />, { wrapper: MemoryRouter });
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('debería llamar a la función de búsqueda y navegar al enviar el formulario', () => {
    const fetchSpy = vi.spyOn(useProductStore.getState(), 'fetchProducts').mockImplementation(() => Promise.resolve());
    render(<Header />, { wrapper: MemoryRouter });

    const searchInput = screen.getByPlaceholderText(/Buscar productos/i);
    const searchButton = screen.getByRole('button', { name: /buscar/i });

    fireEvent.change(searchInput, { target: { value: 'rojo' } });
    fireEvent.click(searchButton);
    
    expect(fetchSpy).toHaveBeenCalledWith('rojo');
    expect(mockNavigate).toHaveBeenCalledWith('/search?query=rojo');
    fetchSpy.mockRestore();
  });
});

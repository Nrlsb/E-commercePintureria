// src/tests/Header.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header.jsx';

describe('Componente Header', () => {

  it('debería renderizar el título de la tienda', () => {
    render(
      <MemoryRouter>
        <Header cartItemCount={0} />
      </MemoryRouter>
    );
    const titleElement = screen.getByText(/Pinturerías Mercurio/i);
    expect(titleElement).toBeInTheDocument();
  });

  // --- PRUEBA CORREGIDA ---
  it('debería mostrar el contador del carrito cuando hay items', () => {
    render(
      <MemoryRouter>
        <Header cartItemCount={5} />
      </MemoryRouter>
    );
    
    // **CORRECCIÓN:** Usamos `getAllByText` para obtener todos los elementos que coincidan.
    // Esto devuelve un array de elementos.
    const cartCounters = screen.getAllByText('5');

    // Verificamos que el array no esté vacío, lo que significa que se encontró al menos un contador.
    expect(cartCounters.length).toBeGreaterThan(0);
    
    // Opcionalmente, podemos verificar el estilo en el primer elemento encontrado.
    expect(cartCounters[0]).toHaveClass('bg-[#E9D502]');
  });

  it('no debería mostrar el contador del carrito cuando está vacío', () => {
    render(
      <MemoryRouter>
        <Header cartItemCount={0} />
      </MemoryRouter>
    );
    const cartCount = screen.queryByText(/(\d+)/);
    expect(cartCount).not.toBeInTheDocument();
  });

  it('debería llamar a la función onSearch al enviar el formulario', () => {
    const handleSearchMock = vi.fn();

    render(
      <MemoryRouter>
        <Header onSearch={handleSearchMock} />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar productos/i);
    const form = searchInput.closest('form');

    fireEvent.change(searchInput, { target: { value: 'latex interior' } });
    fireEvent.submit(form);

    expect(handleSearchMock).toHaveBeenCalledTimes(1);
    expect(handleSearchMock).toHaveBeenCalledWith('latex interior');
  });

  it('debería mostrar "Mi Cuenta" cuando no hay un usuario logueado', () => {
    render(
      <MemoryRouter>
        <Header user={null} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Mi Cuenta/i)).toBeInTheDocument();
  });

  it('debería mostrar el email del usuario cuando está logueado', () => {
    const mockUser = { email: 'test@example.com', role: 'user' };
    render(
      <MemoryRouter>
        <Header user={mockUser} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Hola, test/i)).toBeInTheDocument();
  });
});

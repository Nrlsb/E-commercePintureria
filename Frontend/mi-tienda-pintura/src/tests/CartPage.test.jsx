// src/tests/CartPage.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CartPage from '../pages/CartPage.jsx';

// --- Mock de datos para el carrito ---
const mockCartWithItems = [
  { id: 1, name: 'Látex Interior Mate', brand: 'Alba', price: 15000, quantity: 2, imageUrl: 'url1' },
  { id: 2, name: 'Esmalte Sintético Brillante', brand: 'Sherwin', price: 12500, quantity: 1, imageUrl: 'url2' },
];

// --- Mock de funciones ---
const mockOnUpdateQuantity = vi.fn();
const mockOnRemoveItem = vi.fn();

// Helper para renderizar el componente con las props necesarias
const renderCartPage = (cart) => {
  render(
    <MemoryRouter>
      <CartPage 
        cart={cart} 
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
      />
    </MemoryRouter>
  );
};

// --- Suite de pruebas para el componente CartPage ---
describe('Componente CartPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Prueba 1: Carrito vacío ---
  it('debería mostrar un mensaje cuando el carrito está vacío', () => {
    renderCartPage([]);
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(screen.getByText(/Volver a la tienda/i)).toBeInTheDocument();
  });

  // --- Prueba 2: Carrito con productos (CORREGIDA) ---
  it('debería renderizar los productos del carrito y el total correcto', () => {
    renderCartPage(mockCartWithItems);

    expect(screen.getByText('Látex Interior Mate')).toBeInTheDocument();
    expect(screen.getByText('Esmalte Sintético Brillante')).toBeInTheDocument();

    // **CORRECCIÓN:** Usamos `getAllByText` para buscar el total, ya que aparece
    // tanto en el subtotal como en el total final.
    // Total = (15000 * 2) + (12500 * 1) = 42500
    const totals = screen.getAllByText('$42.500');
    
    // Verificamos que se haya encontrado el texto del total al menos una vez.
    expect(totals.length).toBeGreaterThan(0);
  });

  // --- Prueba 3: Incrementar cantidad ---
  it('debería llamar a onUpdateQuantity al hacer clic en el botón de incrementar', () => {
    renderCartPage(mockCartWithItems);
    const incrementButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(incrementButtons[0]);
    expect(mockOnUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  // --- Prueba 4: Decrementar cantidad ---
  it('debería llamar a onUpdateQuantity al hacer clic en el botón de decrementar', () => {
    renderCartPage(mockCartWithItems);
    const decrementButtons = screen.getAllByRole('button', { name: '-' });
    fireEvent.click(decrementButtons[0]);
    expect(mockOnUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  // --- Prueba 5: Eliminar producto ---
  it('debería llamar a onRemoveItem al hacer clic en el botón de eliminar', () => {
    renderCartPage(mockCartWithItems);
    // Buscamos todos los botones sin nombre accesible (los íconos)
    const allButtons = screen.getAllByRole('button', { name: '' });
    // Encontramos el que contiene el SVG de la papelera
    const removeButton = allButtons.find(btn => btn.querySelector('svg'));
    
    fireEvent.click(removeButton);

    expect(mockOnRemoveItem).toHaveBeenCalledTimes(1);
    expect(mockOnRemoveItem).toHaveBeenCalledWith(1);
  });
});

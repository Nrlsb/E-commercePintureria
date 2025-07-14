import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useCartStore from '../stores/useCartStore';
import useNotificationStore from '../stores/useNotificationStore';

// El archivo de configuración global (src/tests/setup.js) ya se encarga de
// resetear los stores después de cada test. No necesitamos los bloques
// beforeAll o afterEach aquí, lo que hace el código más limpio.

const mockProduct = {
  id: 1,
  name: 'Pintura Latex Blanca',
  price: 120,
  image: 'url/a/la/imagen.jpg',
  stock: 10,
};

describe('ProductCard', () => {
  it('should render product details correctly', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    // Verificamos que el nombre y el precio del producto se muestren
    expect(screen.getByText('Pintura Latex Blanca')).toBeInTheDocument();
    expect(screen.getByText('$120')).toBeInTheDocument();
    // Verificamos que la imagen se renderice con el texto alternativo correcto
    expect(screen.getByAltText('Pintura Latex Blanca')).toBeInTheDocument();
  });

  it('should add product to cart and show notification when "Agregar al carrito" is clicked', () => {
    // "Espiamos" los métodos de nuestros stores para saber si son llamados
    const addToCartSpy = vi.spyOn(useCartStore.getState(), 'addToCart');
    const showNotificationSpy = vi.spyOn(useNotificationStore.getState(), 'showNotification');

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    // Simulamos el clic en el botón de agregar
    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(addButton);

    // Verificamos que el método del store del carrito fue llamado una vez con el producto correcto
    expect(addToCartSpy).toHaveBeenCalledTimes(1);
    expect(addToCartSpy).toHaveBeenCalledWith(mockProduct);

    // Verificamos que el método del store de notificaciones fue llamado con el mensaje correcto
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledWith('Pintura Latex Blanca ha sido agregado al carrito.');
    
    // Es una buena práctica restaurar los "espías" después de cada test
    addToCartSpy.mockRestore();
    showNotificationSpy.mockRestore();
  });

  it('should display "Sin stock" when product stock is 0', () => {
    const productOutOfStock = { ...mockProduct, stock: 0 };

    render(
      <MemoryRouter>
        <ProductCard product={productOutOfStock} />
      </MemoryRouter>
    );

    // Verificamos que se muestre el texto "Sin stock" y que el botón esté deshabilitado
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sin stock/i })).toBeDisabled();
  });
});

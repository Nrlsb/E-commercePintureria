// src/components/ProductFilters.jsx
import React, { useState, useEffect } from 'react';
import { useProductStore } from '../stores/useProductStore';

// Hook personalizado para "debouncing"
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ProductFilters = ({ category }) => {
  const { availableBrands, filters, setFilters, sortOption, setSortOption, fetchProducts } = useProductStore();
  
  // Estados locales para los controles del formulario
  const [localFilters, setLocalFilters] = useState(filters);
  const [localSortOption, setLocalSortOption] = useState(sortOption);

  // Valores "debounced" para los campos de precio
  const debouncedMinPrice = useDebounce(localFilters.minPrice, 500);
  const debouncedMaxPrice = useDebounce(localFilters.maxPrice, 500);

  // --- MEJORA: EFECTO PARA APLICAR FILTROS AUTOMÁTICAMENTE ---
  // Este useEffect se ejecuta cuando cambian los filtros de marca, el orden, o los precios (después del debounce).
  useEffect(() => {
    const newFilters = {
      brands: localFilters.brands,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
    };
    
    // Actualizamos el estado global en el store de Zustand
    setFilters(newFilters);
    setSortOption(localSortOption);
    
    // Llamamos a fetchProducts para obtener la lista actualizada de productos
    fetchProducts(category, 1); // Volvemos a la página 1 con cada nuevo filtro
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters.brands, debouncedMinPrice, debouncedMaxPrice, localSortOption, category]);

  // Sincroniza el estado local si los filtros globales se resetean desde otro lugar
  useEffect(() => {
    setLocalFilters(filters);
    setLocalSortOption(sortOption);
  }, [filters, sortOption]);

  const handleBrandChange = (e) => {
    const { name, checked } = e.target;
    setLocalFilters(prev => {
      const newBrands = checked
        ? [...prev.brands, name]
        : prev.brands.filter(b => b !== name);
      return { ...prev, brands: newBrands };
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e) => {
    setLocalSortOption(e.target.value);
  };
  
  const clearFilters = () => {
    const cleared = { brands: [], minPrice: '', maxPrice: '' };
    setLocalFilters(cleared);
    setLocalSortOption('default');
    // El useEffect se encargará de aplicar y recargar los productos
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
        {/* Ordenar por */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
          <select value={localSortOption} onChange={handleSortChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]">
            <option value="default">Relevancia</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="rating_desc">Mejor Calificados</option>
          </select>
        </div>

        {/* Filtro de Marcas */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-24 overflow-y-auto">
            {availableBrands.map(brand => (
              <label key={brand} className="flex items-center">
                <input type="checkbox" name={brand} checked={localFilters.brands.includes(brand)} onChange={handleBrandChange} className="h-4 w-4 text-[#0F3460] focus:ring-[#0F3460] border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-600">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de Precio */}
        <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <div className="flex space-x-2">
                <input type="number" name="minPrice" value={localFilters.minPrice} onChange={handlePriceChange} placeholder="Mín" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
                <input type="number" name="maxPrice" value={localFilters.maxPrice} onChange={handlePriceChange} placeholder="Máx" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
            </div>
        </div>

        {/* Botón de Limpiar */}
        <div className="lg:col-span-1">
            <button onClick={clearFilters} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Limpiar</button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;

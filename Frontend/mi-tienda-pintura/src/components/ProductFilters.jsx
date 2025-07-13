// src/components/ProductFilters.jsx
import React, { useState, useEffect } from 'react';
import { useProductStore } from '../stores/useProductStore';

const ProductFilters = ({ category }) => {
  // Obtenemos el estado y las acciones del store
  const { availableBrands, filters, setFilters, setSortOption, fetchProducts } = useProductStore();
  
  const [localFilters, setLocalFilters] = useState(filters);

  // Sincronizamos los filtros locales si los filtros globales cambian
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
    setSortOption(e.target.value);
    fetchProducts(category);
  };
  
  const applyFilters = () => {
    setFilters(localFilters);
    fetchProducts(category);
  };

  const clearFilters = () => {
    const cleared = { brands: [], minPrice: '', maxPrice: '' };
    setLocalFilters(cleared);
    setFilters(cleared);
    fetchProducts(category);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
          <select onChange={handleSortChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]">
            <option value="default">Relevancia</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="rating_desc">Mejor Calificados</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {/* Usamos la lista de marcas del store */}
            {availableBrands.map(brand => (
              <label key={brand} className="flex items-center">
                <input type="checkbox" name={brand} checked={localFilters.brands.includes(brand)} onChange={handleBrandChange} className="h-4 w-4 text-[#0F3460] focus:ring-[#0F3460] border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-600">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <div className="flex space-x-2">
                <input type="number" name="minPrice" value={localFilters.minPrice} onChange={handlePriceChange} placeholder="Mín" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
                <input type="number" name="maxPrice" value={localFilters.maxPrice} onChange={handlePriceChange} placeholder="Máx" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
            </div>
        </div>

        <div className="flex space-x-2">
            <button onClick={applyFilters} className="w-full bg-[#0F3460] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#1a4a8a] transition-colors">Aplicar</button>
            <button onClick={clearFilters} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Limpiar</button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;

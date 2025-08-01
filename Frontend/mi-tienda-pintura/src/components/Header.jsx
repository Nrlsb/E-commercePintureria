// Frontend/mi-tienda-pintura/src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { ICONS } from '../data/icons.js';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useProductStore } from '../stores/useProductStore';
import Spinner from './Spinner.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Componente de Menú de Usuario para Escritorio
const UserMenuDesktop = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleLogout = () => {
    logout();
    clearCart();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-gray-300 hover:text-white transition-colors">
        <Icon path={ICONS.user} />
        {/* Se asegura que el nombre de usuario solo se muestre en pantallas medianas y grandes */}
        <span className="hidden md:block ml-2">Hola, {user.email.split('@')[0]}</span>
        <Icon path={ICONS.chevronDown} className="hidden md:block w-4 h-4 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
          <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mi Perfil
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
              Panel Admin
            </Link>
          )}
          <Link to="/my-orders" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mis Compras
          </Link>
          <Link to="/wishlist" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
            Mi Lista de Deseos
          </Link>
          <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">
            Salir
          </button>
        </div>
      )}
    </div>
  );
};


// Componente Principal del Header (con Autocompletar)
const Header = () => {
  const navigate = useNavigate();
  const { setSearchQuery } = useProductStore();
  
  const [localQuery, setLocalQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], brands: [] });
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const cartIconRef = useRef(null); // Referencia para el ícono del carrito
  const miniCartRef = useRef(null); // Referencia para el mini-carrito

  // NUEVO: Estado para controlar la visibilidad del mini-carrito
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  // Efecto para obtener sugerencias con Debounce
  useEffect(() => {
    if (localQuery.trim().length < 2) {
      setSuggestions({ products: [], categories: [], brands: [] });
      setIsSuggestionsOpen(false);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`${API_URL}/api/products/suggestions?q=${localQuery.trim()}`);
        const data = await response.json();
        setSuggestions(data);
        setIsSuggestionsOpen(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timerId);
  }, [localQuery]);

  // Efecto para cerrar las sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
      // Cierra el mini-carrito si se hace clic fuera de él o del ícono del carrito
      if (miniCartRef.current && !miniCartRef.current.contains(event.target) &&
          cartIconRef.current && !cartIconRef.current.contains(event.target)) {
        setIsMiniCartOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef, cartIconRef, miniCartRef]); // Añadir refs como dependencias

  const handleSearch = (query) => {
    setSearchQuery(query);
    setLocalQuery(query);
    setIsSuggestionsOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      handleSearch(localQuery.trim());
    }
  };

  const { user, logout } = useAuthStore();
  const { cart, clearCart } = useCartStore();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleMobileLinkClick = () => setIsMenuOpen(false);
  const handleMobileLogout = () => {
    logout();
    clearCart();
    handleMobileLinkClick();
    navigate('/');
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  // NUEVO: Función para obtener la URL de imagen del ítem del carrito
  const getCartItemImageUrl = (item) => {
    if (item.imageUrl && typeof item.imageUrl === 'object') {
      return item.imageUrl.small || item.imageUrl.medium;
    }
    return item.imageUrl || `https://placehold.co/50x50/cccccc/ffffff?text=Img`;
  };

  return (
    <header className="bg-[#0F3460] text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl font-bold text-white" onClick={handleMobileLinkClick}>
            Pinturerías Mercurio
          </Link>

          {/* Contenedor de Búsqueda Modificado para responsividad */}
          {/* Se muestra en pantallas medianas y grandes, oculto en pequeñas */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 justify-center px-8">
            <form onSubmit={handleSubmit} className="relative w-full max-w-lg">
              <input 
                type="search" 
                placeholder="Buscar productos, marcas y más..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onFocus={() => localQuery.length > 1 && setIsSuggestionsOpen(true)}
                className="w-full py-2 pl-4 pr-10 text-gray-900 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-4">
                {isLoadingSuggestions ? <Spinner className="w-5 h-5 text-gray-500" /> : <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />}
              </button>
              
              {/* Panel de Sugerencias */}
              {isSuggestionsOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl overflow-hidden z-50 text-gray-800">
                  {suggestions.products.length === 0 && suggestions.categories.length === 0 && suggestions.brands.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No se encontraron sugerencias.</div>
                  ) : (
                    <ul className="max-h-96 overflow-y-auto">
                      {suggestions.products.length > 0 && (
                        <li>
                          <h3 className="font-bold text-xs uppercase text-gray-500 px-4 pt-3 pb-1">Productos</h3>
                          <ul>
                            {suggestions.products.map(p => (
                              <li key={`prod-${p.id}`}>
                                <Link to={`/product/${p.id}`} onClick={() => setIsSuggestionsOpen(false)} className="flex items-center px-4 py-2 hover:bg-gray-100">
                                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-contain mr-3"/>
                                  <span>{p.name}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                      {suggestions.categories.length > 0 && (
                        <li>
                          <h3 className="font-bold text-xs uppercase text-gray-500 px-4 pt-3 pb-1">Categorías</h3>
                          <ul>
                            {suggestions.categories.map(c => (
                              <li key={`cat-${c}`}>
                                <button onClick={() => handleSearch(c)} className="w-full text-left px-4 py-2 hover:bg-gray-100">en <span className="font-semibold">{c}</span></button>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                       {suggestions.brands.length > 0 && (
                        <li>
                          <h3 className="font-bold text-xs uppercase text-gray-500 px-4 pt-3 pb-1">Marcas</h3>
                          <ul>
                            {suggestions.brands.map(b => (
                              <li key={`brand-${b}`}>
                                <button onClick={() => handleSearch(b)} className="w-full text-left px-4 py-2 hover:bg-gray-100">en <span className="font-semibold">{b}</span></button>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Menú para Escritorio - Se muestra solo en pantallas medianas y grandes */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <UserMenuDesktop />
            ) : (
              <Link to="/login" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <Icon path={ICONS.user} />
                <span className="ml-2">Mi Cuenta</span>
              </Link>
            )}
            <div className="h-6 border-l border-gray-600"></div>
            {/* NUEVO: Contenedor del ícono del carrito con eventos de hover */}
            <div 
              className="relative" 
              onMouseEnter={() => setIsMiniCartOpen(true)} 
              onMouseLeave={() => setIsMiniCartOpen(false)}
              ref={cartIconRef} // Asignar la referencia
            >
              <Link to="/cart" className="flex items-center text-gray-300 hover:text-white transition-colors relative">
                <Icon path={ICONS.shoppingCart} />
                <span className="ml-2">Carrito</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-[#E9D502] text-[#0F3460] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* NUEVO: Mini-carrito (dropdown) */}
              {isMiniCartOpen && cartItemCount > 0 && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-50 text-gray-800"
                  ref={miniCartRef} // Asignar la referencia
                >
                  <h4 className="px-4 pb-2 text-sm font-semibold border-b border-gray-200">Últimos Productos Añadidos</h4>
                  <div className="max-h-60 overflow-y-auto">
                    {cart.slice(0, 3).map(item => ( // Mostrar solo los últimos 3 ítems
                      <div key={item.id} className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors">
                        <img src={getCartItemImageUrl(item)} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-3" />
                        <div className="flex-grow">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">Cant: {item.quantity} | ${new Intl.NumberFormat('es-AR').format(item.price)} c/u</p>
                        </div>
                        <p className="text-sm font-semibold">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
                      </div>
                    ))}
                    {cart.length > 3 && (
                        <p className="text-center text-xs text-gray-500 py-2">... {cart.length - 3} más en el carrito</p>
                    )}
                  </div>
                  <div className="border-t border-gray-200 pt-2 px-4">
                    <div className="flex justify-between text-base font-semibold py-2">
                      <span>Subtotal:</span>
                      <span>${new Intl.NumberFormat('es-AR').format(cartSubtotal)}</span>
                    </div>
                    <Link to="/cart" onClick={() => setIsMiniCartOpen(false)} className="block w-full text-center bg-[#0F3460] text-white py-2 rounded-md hover:bg-[#1a4a8a] transition-colors text-sm font-semibold">
                      Ver Carrito Completo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones para Móvil - Se muestran solo en pantallas pequeñas */}
          <div className="md:hidden flex items-center space-x-4">
             <Link to="/cart" className="text-white relative">
              <Icon path={ICONS.shoppingCart} className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E9D502] text-[#0F3460] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Panel Lateral para Móvil */}
      {isMenuOpen && (
        <div className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 transition-opacity duration-300`} onClick={() => setIsMenuOpen(false)}>
          <div className={`fixed top-0 right-0 w-4/5 max-w-sm h-full bg-[#0F3460] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex flex-col h-full">
              <button onClick={() => setIsMenuOpen(false)} className="self-end text-white mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              {/* Barra de búsqueda móvil */}
              <form onSubmit={handleSubmit} className="mb-8">
                <input type="search" placeholder="Buscar..." value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} className="w-full py-2 px-4 text-gray-900 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E9D502]"/>
              </form>

              <nav className="flex flex-col space-y-4 text-lg text-gray-200">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-white font-semibold">Hola, {user.email.split('@')[0]}</div>
                    <hr className="border-gray-500"/>
                    <Link to="/profile" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mi Perfil</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Panel Admin</Link>
                    )}
                    <Link to="/my-orders" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mis Compras</Link>
                    <Link to="/wishlist" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mi Lista de Deseos</Link>
                    <button onClick={handleMobileLogout} className="w-full text-left px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Salir</button>
                  </>
                ) : (
                  <Link to="/login" onClick={handleMobileLinkClick} className="px-4 py-2 hover:bg-[#1a4a8a] rounded-md">Mi Cuenta</Link>
                )}
              </nav>

              <div className="mt-auto text-center text-gray-400 text-sm">
                Pinturerías Mercurio &copy; 2024
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

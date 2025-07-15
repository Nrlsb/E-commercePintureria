// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import Spinner from '../components/Spinner.jsx'; // 1. Importar el Spinner

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // 2. Añadir estado de carga
  const navigate = useNavigate();
  
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // 3. Activar la carga
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      
      login(data.token);
      
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // 4. Desactivar la carga
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Iniciar sesión</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... campos del formulario ... */}
            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-[#0F3460] focus:ring-[#0F3460] border-gray-300 rounded" />
                    <span className="ml-2 text-gray-600">Mantener iniciada</span>
                </label>
                <Link to="/forgot-password" className="font-medium text-[#0F3460] hover:underline">
                  Olvidé mi contraseña
                </Link>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="flex justify-end">
                {/* 5. Renderizado condicional del botón */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-32 flex justify-center items-center px-8 py-3 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                >
                  {loading ? <Spinner /> : 'Ingresar'}
                </button>
            </div>
          </form>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
            {/* ... sección de registro ... */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

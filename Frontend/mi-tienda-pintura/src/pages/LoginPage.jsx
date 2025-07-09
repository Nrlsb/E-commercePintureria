// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      onLoginSuccess(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4">
      {/* CAMBIO: Sombra y bordes más pronunciados. */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Email</label>
            {/* CAMBIO: Estilo de input mejorado con focus ring. */}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]" required />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {/* CAMBIO: Botón con el color primario de la marca. */}
          <button type="submit" className="w-full p-3 text-white bg-[#0F3460] rounded-lg font-semibold hover:bg-[#1a4a8a] transition-colors duration-300">
            Ingresar
          </button>
        </form>
        <p className="text-center text-gray-600">
          ¿No tienes una cuenta? {/* CAMBIO: Estilo del enlace. */}
          <Link to="/register" className="font-semibold text-[#0F3460] hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      onLoginSuccess(data.token, data.user);
      navigate('/'); // Redirige al inicio después del login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-md" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-md" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full p-3 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Ingresar
          </button>
        </form>
        <p className="text-center">
          ¿No tienes una cuenta? <Link to="/register" className="text-blue-600 hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

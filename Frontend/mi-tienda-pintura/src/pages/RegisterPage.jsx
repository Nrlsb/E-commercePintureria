// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar');
      }
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000); // Redirige al login después de 2 seg
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Crear Cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-md" required />
          </div>
          <div>
            {/* Aquí estaba el error, se corrigió </p> por </label> */}
            <label className="block mb-1 font-medium">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-md" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <button type="submit" className="w-full p-3 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Registrarse
          </button>
        </form>
        <p className="text-center">
          ¿Ya tienes una cuenta? <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

// Frontend/mi-tienda-pintura/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // El token se obtiene directamente de los parámetros de la URL a través de useParams
      const response = await fetchWithCsrf(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Usamos el mensaje de error que viene de la API
        throw new Error(data.message || 'El token es inválido o ha expirado.');
      }
      
      setMessage(data.message + ' Serás redirigido en 3 segundos.');
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ingresa tu Nueva Contraseña</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium text-gray-600">Nueva Contraseña:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-600">Confirmar Contraseña:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]"
                required
              />
            </div>

            {message && <p className="text-green-600 bg-green-50 p-3 rounded-md text-center">{message}</p>}
            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400"
            >
              {loading ? <Spinner /> : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

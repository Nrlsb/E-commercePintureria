// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner'; // Importar Spinner

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- COMPONENTE MEJORADO CON 'id' y 'htmlFor' ---
const InputField = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
    <input id={id} {...props} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F3460]" />
  </div>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emailConfirm: '',
    password: '',
    passwordConfirm: '',
    terms: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // Estado de carga
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true); // Activar spinner

    if (formData.email !== formData.emailConfirm) {
      setLoading(false);
      return setError('Los correos electrónicos no coinciden.');
    }
    if (formData.password !== formData.passwordConfirm) {
      setLoading(false);
      return setError('Las contraseñas no coinciden.');
    }
    if (formData.password.length < 6) {
      setLoading(false);
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }
    if (!formData.terms) {
      setLoading(false);
      return setError('Debes aceptar los términos y condiciones.');
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar');
      }
      setSuccess('¡Registro exitoso! Serás redirigido para iniciar sesión.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // Desactivar spinner
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Crear una nueva cuenta</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">1. Información personal</h2>
              {/* --- CORRECCIÓN: Se añade 'id' a cada campo --- */}
              <InputField id="firstName" label="Nombres:" name="firstName" value={formData.firstName} onChange={handleChange} required />
              <InputField id="lastName" label="Apellido:" name="lastName" value={formData.lastName} onChange={handleChange} required />
              <InputField id="phone" label="Teléfono:" name="phone" value={formData.phone} onChange={handleChange} />
              <InputField id="email" label="Email:" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <InputField id="emailConfirm" label="Repetir Email:" name="emailConfirm" type="email" value={formData.emailConfirm} onChange={handleChange} required />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">2. Ingrese su clave</h2>
              <InputField id="password" label="Contraseña:" name="password" type="password" value={formData.password} onChange={handleChange} required />
              <InputField id="passwordConfirm" label="Repetir Contraseña:" name="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={handleChange} required />
              
              <div className="pt-4">
                <label htmlFor="terms" className="flex items-center cursor-pointer">
                  <input id="terms" type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} className="h-4 w-4 text-[#0F3460] focus:ring-[#0F3460] border-gray-300 rounded" />
                  <span className="ml-2 text-sm text-gray-600">He leído y estoy de acuerdo con los <a href="#" className="text-[#0F3460] hover:underline">Términos y condiciones</a> del servicio.</span>
                </label>
              </div>

              {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
              {success && <p className="text-green-500 text-sm text-center pt-2">{success}</p>}

              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={loading} // Deshabilitar botón mientras carga
                  className="px-8 py-3 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                >
                  {loading ? <Spinner /> : 'Registrarme'} {/* Mostrar Spinner si está cargando */}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

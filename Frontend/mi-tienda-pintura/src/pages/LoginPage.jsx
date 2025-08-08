// Frontend/mi-tienda-pintura/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import Spinner from '../components/Spinner.jsx';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.483-11.188-8.197l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.914 36.646 44 31.023 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetchWithCsrf(`${API_URL}/api/auth/login`, {
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
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-neutral-800 mb-6 border-b pb-4">Iniciar sesión</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-1 font-medium text-neutral-500">Su E-Mail: <span className="text-red-500">*</span></label>
              <input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 font-medium text-neutral-500">Su Clave: <span className="text-red-500">*</span></label>
              <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <label htmlFor="remember" className="flex items-center cursor-pointer">
                    <input id="remember" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded" />
                    <span className="ml-2 text-neutral-500">Mantener iniciada</span>
                </label>
                <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                  Olvidé mi contraseña
                </Link>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-32 flex justify-center items-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:bg-neutral-400 disabled:cursor-wait"
                >
                  {loading ? <Spinner /> : 'Ingresar'}
                </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">O continúa con</span>
              </div>
            </div>
            <div className="mt-6">
              <a 
                href={`${API_URL}/api/auth/google`}
                className="w-full inline-flex justify-center py-2 px-4 border border-neutral-300 rounded-md shadow-sm bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-100"
              >
                <GoogleIcon />
                Iniciar sesión con Google
              </a>
            </div>
          </div>

        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Registrarse</h2>
            <p className="text-neutral-500 mb-6">Creando una cuenta usted puede comprar productos y tener una lista de deseos.</p>
            <Link to="/register" className="inline-block w-full text-center px-8 py-3 bg-neutral-200 text-neutral-800 font-semibold rounded-lg hover:bg-neutral-300 transition-colors">
                Registrarme
            </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

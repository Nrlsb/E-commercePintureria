// Frontend/mi-tienda-pintura/src/pages/AuthCallbackPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import Spinner from '../components/Spinner';

/**
 * Esta página es un intermediario invisible para el usuario.
 * Su único propósito es capturar el token JWT de la URL,
 * guardarlo en el estado global y redirigir al usuario.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Si encontramos un token, iniciamos sesión en el store
      login(token);
      // Y redirigimos al usuario a la página de inicio
      navigate('/');
    } else {
      // Si no hay token, algo salió mal, redirigimos al login con un error
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, login, navigate]);

  // Muestra un spinner mientras se procesa la redirección
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center">
      <Spinner className="w-12 h-12 text-[#0F3460]" />
      <p className="mt-4 text-gray-600">Autenticando, por favor espera...</p>
    </div>
  );
};

export default AuthCallbackPage;

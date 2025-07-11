// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Este componente protege rutas que solo deben ser accesibles para usuarios logueados.
const ProtectedRoute = ({ user }) => {
  // Si no hay un usuario logueado, redirige a la página de login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario está logueado, renderiza el contenido de la ruta anidada.
  return <Outlet />;
};

export default ProtectedRoute;

// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Este componente protege las rutas que solo deben ser accesibles para administradores.
const AdminRoute = ({ user }) => {
  // Si no hay un usuario logueado o el rol no es 'admin',
  // redirige al usuario a la página de inicio.
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si el usuario es un administrador, renderiza el contenido de la ruta.
  // <Outlet /> representa el componente de la página anidada (ej: AdminDashboardPage).
  return <Outlet />;
};

export default AdminRoute;

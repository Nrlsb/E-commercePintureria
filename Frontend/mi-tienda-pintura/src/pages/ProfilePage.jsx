// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Componente para la información del perfil
const ProfileInformation = ({ user, token }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
    });
    const [loading, setLoading] = useState(false);
    const showNotification = useNotificationStore(state => state.showNotification);
    const login = useAuthStore(state => state.login);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al actualizar el perfil.');
            
            // Refrescar el token en el store para que los datos se actualicen en toda la app
            const newTokenResponse = await fetch(`${API_URL}/api/auth/refresh-token`, { // Asumiendo que tienes este endpoint
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            const { token: newToken } = await newTokenResponse.json();
            login(newToken);

            showNotification(data.message, 'success');
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Información Personal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="text-right">
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] disabled:bg-gray-400">
                        {loading ? <Spinner /> : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const ProfilePage = () => {
  const { user, token } = useAuthStore();

  if (!user) {
    return <div className="text-center p-10"><Spinner /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Perfil</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <ProfileInformation user={user} token={token} />
        </div>
        <div className="md:col-span-2">
          {/* Aquí iría el componente AddressManager */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Direcciones</h2>
            <p className="text-gray-600">Próximamente podrás gestionar tus direcciones de envío aquí.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

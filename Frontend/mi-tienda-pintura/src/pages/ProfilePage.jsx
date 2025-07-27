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
    const [loading, setLoading] = useState(false); // Estado de carga
    const showNotification = useNotificationStore(state => state.showNotification);
    const login = useAuthStore(state => state.login);
    // NUEVO: Obtenemos la función refreshToken del store
    const refreshToken = useAuthStore(state => state.refreshToken); 

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Activar spinner
        try {
            // Antes de hacer la petición, aseguramos que tenemos un token válido y, si es necesario, lo refrescamos.
            let currentToken = token;
            if (user?.needsTokenRefresh) { // Si el middleware de backend marcó que necesita refresco
                const newToken = await refreshToken();
                if (newToken) {
                    currentToken = newToken;
                } else {
                    // Si el refresco falla, la función refreshToken ya maneja el logout.
                    // Detenemos la ejecución aquí.
                    setLoading(false);
                    return; 
                }
            }

            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}` // Usar el token (posiblemente refrescado)
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al actualizar el perfil.');
            
            // Si la actualización del perfil es exitosa, el token no necesita ser refrescado aquí
            // porque ya lo manejamos antes de la petición o porque el token actual es válido.
            // No es necesario llamar a login(newToken) aquí a menos que el backend devuelva un nuevo token
            // con la respuesta de actualización de perfil, lo cual no es el caso en tu backend actual.
            // La información del usuario en el store se actualizará automáticamente cuando se cargue el nuevo token.
            
            showNotification(data.message, 'success');
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false); // Desactivar spinner
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
                    <button 
                        type="submit" 
                        disabled={loading} // Deshabilitar botón mientras carga
                        className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] disabled:bg-gray-400"
                    >
                        {loading ? <Spinner /> : 'Guardar Cambios'} {/* Mostrar Spinner si está cargando */}
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

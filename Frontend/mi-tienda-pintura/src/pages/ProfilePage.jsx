// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import ConfirmationModal from '../components/ConfirmationModal';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- Componente de Formulario de Dirección ---
const AddressForm = ({ onSave, onCancel, address = {} }) => {
    const [formData, setFormData] = useState({
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        is_default: address.is_default || false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg mt-4">
            <InputField name="address_line1" value={formData.address_line1} onChange={handleChange} placeholder="Calle y número" required />
            <InputField name="address_line2" value={formData.address_line2} onChange={handleChange} placeholder="Piso, departamento, etc. (Opcional)" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Código Postal" required />
                <InputField name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad" required />
                <InputField name="state" value={formData.state} onChange={handleChange} placeholder="Provincia" required />
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="is_default" name="is_default" checked={formData.is_default} onChange={handleChange} className="h-4 w-4 text-[#0F3460] focus:ring-[#0F3460] border-gray-300 rounded" />
                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">Establecer como dirección predeterminada</label>
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#0F3460] border border-transparent rounded-md hover:bg-[#1a4a8a]">Guardar Dirección</button>
            </div>
        </form>
    );
};

const InputField = (props) => (
    <input {...props} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F3460] focus:border-[#0F3460]" />
);


// --- Componente para gestionar las direcciones ---
const AddressManager = ({ token }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [deletingAddress, setDeletingAddress] = useState(null);
    const showNotification = useNotificationStore(state => state.showNotification);

    const fetchAddresses = useCallback(async () => {
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/user/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar las direcciones.');
            const data = await response.json();
            setAddresses(data);
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showNotification]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleSaveAddress = async (formData) => {
        const isEditing = !!editingAddress;
        const url = isEditing ? `${API_URL}/api/user/addresses/${editingAddress.id}` : `${API_URL}/api/user/addresses`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithCsrf(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar la dirección.');
            
            showNotification(`Dirección ${isEditing ? 'actualizada' : 'agregada'} con éxito.`, 'success');
            setShowForm(false);
            setEditingAddress(null);
            fetchAddresses(); // Recargar la lista de direcciones
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleDeleteAddress = async () => {
        if (!deletingAddress) return;
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/user/addresses/${deletingAddress.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al eliminar la dirección.');
            showNotification('Dirección eliminada con éxito.', 'success');
            setDeletingAddress(null);
            fetchAddresses();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAddress(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Mis Direcciones</h2>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Agregar Nueva
                    </button>
                )}
            </div>

            {/* --- CORRECCIÓN APLICADA AQUÍ --- */}
            {/* Se asegura de pasar un objeto vacío {} si editingAddress es null */}
            {showForm && <AddressForm onSave={handleSaveAddress} onCancel={handleCancel} address={editingAddress || {}} />}
            
            {loading && <div className="text-center py-4"><Spinner className="w-8 h-8 text-gray-500 mx-auto" /></div>}

            {!loading && addresses.length === 0 && !showForm && (
                <p className="text-gray-600 text-center py-4">Aún no has agregado ninguna dirección.</p>
            )}

            {!loading && addresses.length > 0 && (
                <div className="space-y-4 mt-4">
                    {addresses.map(addr => (
                        <div key={addr.id} className="border p-4 rounded-md flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{addr.address_line1}, {addr.address_line2}</p>
                                <p className="text-sm text-gray-600">{addr.city}, {addr.state}, {addr.postal_code}</p>
                                {addr.is_default && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">Predeterminada</span>}
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEdit(addr)} className="p-1 text-gray-500 hover:text-blue-600"><Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" className="w-5 h-5" /></button>
                                <button onClick={() => setDeletingAddress(addr)} className="p-1 text-gray-500 hover:text-red-600"><Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {deletingAddress && (
                <ConfirmationModal
                    isOpen={!!deletingAddress}
                    onClose={() => setDeletingAddress(null)}
                    onConfirm={handleDeleteAddress}
                    title="Eliminar Dirección"
                    message="¿Estás seguro de que quieres eliminar esta dirección? Esta acción es irreversible."
                    confirmText="Sí, Eliminar"
                    iconPath="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    iconColor="text-red-500"
                />
            )}
        </div>
    );
};


// --- Componente de Información Personal ---
const ProfileInformation = ({ user, token }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dni: user.dni || '' 
    });
    const [loading, setLoading] = useState(false);
    const showNotification = useNotificationStore(state => state.showNotification);
    const login = useAuthStore(state => state.login);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                dni: user.dni || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al actualizar el perfil.');
            
            const newTokenResponse = await fetchWithCsrf(`${API_URL}/api/auth/refresh-token`, {
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
                <div>
                    <label className="block text-sm font-medium text-gray-700">DNI</label>
                    <input 
                        type="text" 
                        name="dni" 
                        value={formData.dni} 
                        onChange={handleChange} 
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md" 
                        placeholder="Requerido para pagos"
                    />
                </div>
                <div className="text-right">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] disabled:bg-gray-400"
                    >
                        {loading ? <Spinner /> : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- Componente Principal de la Página de Perfil ---
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
          <AddressManager token={token} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

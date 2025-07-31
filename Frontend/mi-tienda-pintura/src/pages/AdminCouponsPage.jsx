// src/pages/AdminCouponsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import ConfirmationModal from '../components/ConfirmationModal';
import CouponFormModal from '../components/CouponFormModal';
import { fetchWithCsrf } from '../api/api'; // Importar fetchWithCsrf

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ICONS = {
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
};

const AdminCouponsPage = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    const token = useAuthStore(state => state.token);
    const showNotification = useNotificationStore(state => state.showNotification);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/coupons/admin`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('No se pudieron cargar los cupones.');
            const data = await response.json();
            setCoupons(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleOpenFormModal = (coupon = null) => {
        setSelectedCoupon(coupon);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedCoupon(null);
    };

    const handleOpenDeleteModal = (coupon) => {
        setSelectedCoupon(coupon);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedCoupon(null);
    };

    const handleSave = () => {
        handleCloseFormModal();
        fetchCoupons();
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCoupon) return;
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/coupons/admin/${selectedCoupon.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Error al eliminar el cupón.');
            showNotification('Cupón eliminado con éxito.', 'success');
            handleCloseDeleteModal();
            fetchCoupons();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    if (loading) return <div className="text-center p-10"><Spinner className="w-12 h-12 mx-auto text-[#0F3460]" /></div>;
    if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Cupones</h1>
                <button onClick={() => handleOpenFormModal()} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
                    <Icon path={ICONS.add} className="w-5 h-5" />
                    <span>Crear Cupón</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4">Código</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Uso</th>
                            <th className="p-4">Expira</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => (
                            <tr key={coupon.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold">{coupon.code}</td>
                                <td className="p-4 capitalize">{coupon.discount_type}</td>
                                <td className="p-4">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="p-4">{coupon.usage_count} / {coupon.usage_limit || '∞'}</td>
                                <td className="p-4">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('es-AR') : 'Nunca'}</td>
                                <td className="p-4 flex justify-center space-x-2">
                                    <button onClick={() => handleOpenFormModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Icon path={ICONS.edit} className="w-5 h-5" /></button>
                                    <button onClick={() => handleOpenDeleteModal(coupon)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Icon path={ICONS.delete} className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <CouponFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSave={handleSave}
                    coupon={selectedCoupon}
                />
            )}

            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteConfirm}
                    title="Eliminar Cupón"
                    message={`¿Estás seguro de que quieres eliminar el cupón "${selectedCoupon?.code}"? Esta acción es irreversible.`}
                    confirmText="Sí, Eliminar"
                />
            )}
        </div>
    );
};

export default AdminCouponsPage;

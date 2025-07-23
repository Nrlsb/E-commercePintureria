// src/components/CouponFormModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from './Spinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input {...props} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F3460] focus:border-[#0F3460]" />
    </div>
);

const CouponFormModal = ({ isOpen, onClose, onSave, coupon }) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase_amount: '',
        usage_limit: '',
        expires_at: '',
        is_active: true,
    });
    const [loading, setLoading] = useState(false);
    const token = useAuthStore(state => state.token);
    const showNotification = useNotificationStore(state => state.showNotification);

    const isEditing = Boolean(coupon);

    useEffect(() => {
        if (coupon) {
            setFormData({
                code: coupon.code || '',
                description: coupon.description || '',
                discount_type: coupon.discount_type || 'percentage',
                discount_value: coupon.discount_value || '',
                min_purchase_amount: coupon.min_purchase_amount || '',
                usage_limit: coupon.usage_limit || '',
                expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
                is_active: coupon.is_active,
            });
        } else {
            setFormData({
                code: '', description: '', discount_type: 'percentage', discount_value: '',
                min_purchase_amount: '', usage_limit: '', expires_at: '', is_active: true,
            });
        }
    }, [coupon]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = isEditing ? `${API_URL}/api/coupons/admin/${coupon.id}` : `${API_URL}/api/coupons/admin`;
        const method = isEditing ? 'PUT' : 'POST';

        const body = {
            ...formData,
            expires_at: formData.expires_at || null,
            usage_limit: formData.usage_limit || null,
            min_purchase_amount: formData.min_purchase_amount || null,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al guardar el cupón.');
            showNotification(`Cupón ${isEditing ? 'actualizado' : 'creado'} con éxito.`, 'success');
            onSave();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">{isEditing ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Código" name="code" value={formData.code} onChange={handleChange} required />
                            <InputField label="Descripción" name="description" value={formData.description} onChange={handleChange} />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo de Descuento</label>
                                <select name="discount_type" value={formData.discount_type} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="percentage">Porcentaje</option>
                                    <option value="fixed">Monto Fijo</option>
                                </select>
                            </div>
                            <InputField label="Valor del Descuento" name="discount_value" type="number" value={formData.discount_value} onChange={handleChange} required />
                            <InputField label="Monto Mínimo de Compra" name="min_purchase_amount" type="number" placeholder="Opcional" value={formData.min_purchase_amount} onChange={handleChange} />
                            <InputField label="Límite de Uso Total" name="usage_limit" type="number" placeholder="Opcional (infinito por defecto)" value={formData.usage_limit} onChange={handleChange} />
                            <InputField label="Fecha de Expiración" name="expires_at" type="date" value={formData.expires_at} onChange={handleChange} />
                            <div className="flex items-center mt-6">
                                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-[#0F3460] focus:ring-[#0F3460] border-gray-300 rounded" />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Activo</label>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] disabled:bg-gray-400 w-32 flex justify-center">
                            {loading ? <Spinner /> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default CouponFormModal;

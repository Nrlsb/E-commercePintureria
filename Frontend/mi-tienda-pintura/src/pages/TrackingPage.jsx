// src/pages/TrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ICONS = {
    package: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 12.78l-7-4V10l7 4.22V18l-7-4v-1.54l7 4zM13 18v-4.22l7-4V10l-7 4zM12 2.22L18.09 6 12 9.78 5.91 6 12 2.22z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
};

const TrackingPage = () => {
    const { trackingNumber } = useParams();
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = useAuthStore(state => state.token);
    const showNotification = useNotificationStore(state => state.showNotification);

    useEffect(() => {
        const fetchTracking = async () => {
            if (!token || !trackingNumber) return;
            try {
                const response = await fetchWithCsrf(`${API_URL}/api/shipping/track/${trackingNumber}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'No se pudo obtener la información de seguimiento.');
                }
                const data = await response.json();
                setTrackingInfo(data);
            } catch (err) {
                setError(err.message);
                showNotification(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchTracking();
    }, [trackingNumber, token, showNotification]);

    if (loading) {
        return <div className="flex-grow flex items-center justify-center"><Spinner className="w-12 h-12 text-[#0F3460]" /></div>;
    }

    if (error) {
        return (
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-red-700 mb-4">Error al buscar el envío</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link to="/my-orders" className="bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a]">
                    Volver a Mis Compras
                </Link>
            </div>
        );
    }

    if (!trackingInfo) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white p-8 rounded-lg shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Seguimiento de Envío</h1>
                        <p className="text-gray-500 font-mono mt-1">{trackingInfo.trackingNumber}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-left md:text-right">
                        <p className="text-sm text-gray-500">Estado Actual</p>
                        <p className="font-bold text-xl text-green-600">{trackingInfo.status}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-700 mb-6">Historial del Envío</h2>
                    <ol className="relative border-l border-gray-200">
                        {trackingInfo.history.slice().reverse().map((event, index) => (
                            <li key={index} className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white">
                                    <Icon path={index === 0 ? ICONS.check : ICONS.package} className="w-5 h-5 text-blue-600" />
                                </span>
                                <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                                    {event.status}
                                    {index === 0 && <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3">Último</span>}
                                </h3>
                                <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                                    {new Date(event.date).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}
                                </time>
                                <p className="text-base font-normal text-gray-500">{event.location}</p>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="mt-8 text-center">
                     <Link to="/my-orders" className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                        Volver a Mis Compras
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TrackingPage;

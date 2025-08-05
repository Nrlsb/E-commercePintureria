// src/pages/AdminWebhookEventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const StatusBadge = ({ status }) => {
  const styles = {
    processed: 'bg-green-100 text-green-800',
    received: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const AdminWebhookEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reprocessingId, setReprocessingId] = useState(null);
    const token = useAuthStore(state => state.token);
    const showNotification = useNotificationStore(state => state.showNotification);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/webhooks`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('No se pudieron cargar los eventos.');
            const data = await response.json();
            setEvents(data);
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleReprocess = async (eventId) => {
        setReprocessingId(eventId);
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/webhooks/reprocess/${eventId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al re-procesar.');
            showNotification(data.message, 'success');
            // Refrescar la lista después de un breve retraso para dar tiempo al procesamiento
            setTimeout(fetchEvents, 2000);
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setReprocessingId(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Historial de Webhooks</h1>
                <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4">Fecha</th>
                            <th className="p-4">ID Evento (MP)</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Error</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-10"><Spinner /></td></tr>
                        ) : (
                            events.map(event => (
                                <tr key={event.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 text-sm">{new Date(event.created_at).toLocaleString('es-AR')}</td>
                                    <td className="p-4 font-mono text-xs">{event.event_id}</td>
                                    <td className="p-4 text-sm">{event.event_type}</td>
                                    <td className="p-4"><StatusBadge status={event.status} /></td>
                                    <td className="p-4 text-xs text-red-600">{event.error_message}</td>
                                    <td className="p-4 text-center">
                                        {event.status === 'failed' && (
                                            <button
                                                onClick={() => handleReprocess(event.id)}
                                                disabled={reprocessingId === event.id}
                                                className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                                            >
                                                {reprocessingId === event.id ? <Spinner className="w-4 h-4" /> : 'Re-procesar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminWebhookEventsPage;

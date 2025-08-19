// Frontend/mi-tienda-pintura/src/pages/AdminReportsPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import { fetchWithCsrf } from '../api/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ICONS = {
    download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    calendar: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
};

const reportTypes = [
    { key: 'salesByCategory', label: 'Ventas por Categoría' },
    { key: 'salesByBrand', label: 'Ventas por Marca' },
    { key: 'couponPerformance', label: 'Rendimiento de Cupones' },
    { key: 'topCustomers', label: 'Mejores Clientes' },
];

const AdminReportsPage = () => {
    const [reportType, setReportType] = useState('salesByCategory');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(null);

    const token = useAuthStore(state => state.token);
    const showNotification = useNotificationStore(state => state.showNotification);

    const handleGenerateReport = async () => {
        setLoading(true);
        setReportData(null);
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/reports/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reportType, startDate, endDate, format: 'json' }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al generar el reporte.');
            setReportData(data);
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        setExporting(format);
        try {
            const response = await fetchWithCsrf(`${API_URL}/api/reports/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reportType, startDate, endDate, format }),
            });
            if (!response.ok) throw new Error(`Error al exportar a ${format.toUpperCase()}.`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}-${startDate}-to-${endDate}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setExporting(null);
        }
    };

    const renderReportTable = () => {
        if (!reportData) return null;
        if (reportData.length === 0) {
            return <p className="text-center text-gray-500 mt-8">No se encontraron datos para los filtros seleccionados.</p>;
        }

        const headers = Object.keys(reportData[0]);
        const headerLabels = {
            dimension: 'Categoría/Marca',
            totalRevenue: 'Ingresos',
            totalItemsSold: 'Items Vendidos',
            orderCount: 'N° Órdenes',
            code: 'Código',
            timesUsed: 'Usos',
            totalDiscount: 'Descuento Total',
            email: 'Email',
            firstName: 'Nombre',
            lastName: 'Apellido',
            totalSpent: 'Gasto Total'
        };

        return (
            <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            {headers.map(header => <th key={header} className="p-4 font-semibold">{headerLabels[header] || header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                                {headers.map(header => (
                                    <td key={header} className="p-4">
                                        {typeof row[header] === 'number' ? `$${new Intl.NumberFormat('es-AR').format(row[header])}` : row[header]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Generador de Reportes</h1>
                <Link to="/admin" className="text-blue-600 hover:underline">&larr; Volver al Panel</Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Reporte</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            {reportTypes.map(rt => <option key={rt.key} value={rt.key}>{rt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <button onClick={handleGenerateReport} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex justify-center items-center">
                        {loading ? <Spinner /> : 'Generar Reporte'}
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Resultados del Reporte</h2>
                        <div className="flex space-x-2">
                            <button onClick={() => handleExport('csv')} disabled={exporting === 'csv'} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2">
                                {exporting === 'csv' ? <Spinner /> : <Icon path={ICONS.download} className="w-5 h-5" />}
                                <span>CSV</span>
                            </button>
                            <button onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center space-x-2">
                                {exporting === 'pdf' ? <Spinner /> : <Icon path={ICONS.download} className="w-5 h-5" />}
                                <span>PDF</span>
                            </button>
                        </div>
                    </div>
                    {renderReportTable()}
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;

// src/components/OrderDetailModal.jsx
import React from 'react';
import Icon from './Icon';

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 sticky top-0 bg-white border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Detalle de la Orden #{order.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Información del Cliente</h3>
            <p><strong>Nombre:</strong> {order.first_name} {order.last_name}</p>
            <p><strong>Email:</strong> {order.email}</p>
            <p><strong>Teléfono:</strong> {order.phone || 'No provisto'}</p>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Información de la Orden</h3>
            <p><strong>Fecha:</strong> {new Date(order.created_at).toLocaleString('es-AR')}</p>
            <p><strong>Estado:</strong> <span className="font-bold capitalize">{order.status.replace('_', ' ')}</span></p>
            <p><strong>Costo de envío:</strong> {formatCurrency(order.shipping_cost || 0)}</p>
            <p><strong>Total:</strong> <span className="font-bold text-xl">{formatCurrency(order.total_amount)}</span></p>
          </div>
        </div>
        <div className="p-6 border-t">
          <h3 className="font-semibold text-lg mb-4">Productos</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                <div className="flex items-center">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md mr-4" />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;

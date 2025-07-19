// src/components/ConfirmationModal.jsx
import React from 'react';
import Icon from './Icon';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Acción',
  message = '¿Estás seguro de que quieres continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  iconPath = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
  iconColor = "text-yellow-500"
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4`}>
            <Icon path={iconPath} className={`h-6 w-6 ${iconColor}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-2">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

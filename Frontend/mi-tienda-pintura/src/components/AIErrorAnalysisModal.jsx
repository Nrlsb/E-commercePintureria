// Frontend/mi-tienda-pintura/src/components/AIErrorAnalysisModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import Spinner from './Spinner';

const AIErrorAnalysisModal = ({ isOpen, onClose, error, errorInfo, analysis, loading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-red-600 text-white rounded-t-lg flex justify-between items-center">
              <div className="flex items-center">
                <Icon path="M11 15h2v2h-2zm0-8h2v6h-2zM1 21h22L12 2 1 21z" className="w-6 h-6 mr-3" />
                <h2 className="text-xl font-bold">Análisis de Error por IA (Admin)</h2>
              </div>
              <button onClick={onClose} className="text-white hover:bg-red-700 rounded-full p-1">
                <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-800">Mensaje de Error:</h3>
                <p className="text-red-700 bg-red-50 p-2 rounded-md font-mono text-sm">{error?.toString()}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-800">Análisis de la IA:</h3>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner className="w-8 h-8 text-gray-600" />
                    <span className="ml-3">La IA está analizando el error...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: analysis }}>
                  </div>
                )}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-gray-600">Ver Detalles Técnicos (Stack Trace)</summary>
                <pre className="mt-2 bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto">
                  <code>
                    {errorInfo?.componentStack}
                  </code>
                </pre>
              </details>
            </div>

            <div className="p-4 bg-gray-50 rounded-b-lg text-right">
              <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIErrorAnalysisModal;

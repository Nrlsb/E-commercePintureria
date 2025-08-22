// Frontend/mi-tienda-pintura/src/components/ErrorBoundary.jsx
import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import AIErrorAnalysisModal from './AIErrorAnalysisModal.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      analysis: null,
      loadingAnalysis: false,
      showModal: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);

    // Verificar si el usuario es admin para obtener análisis de IA
    const user = useAuthStore.getState().user;
    if (user && user.role === 'admin') {
      this.getAIAnalysis(error, errorInfo);
    }
  }

  getAIAnalysis = async (error, errorInfo) => {
    this.setState({ loadingAnalysis: true });
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const token = useAuthStore.getState().token;

    try {
      const response = await fetch(`${API_URL}/api/debug/analyze-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          errorMessage: error.toString(),
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener el análisis del error.');
      }

      const data = await response.json();
      this.setState({ analysis: data.analysis, loadingAnalysis: false, showModal: true });

    } catch (err) {
      console.error("Error al obtener análisis de IA:", err);
      this.setState({ 
        loadingAnalysis: false,
        analysis: 'No se pudo obtener el análisis de la IA. Revisa la consola del navegador y del servidor para más detalles.',
        showModal: true,
       });
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  }

  render() {
    const user = useAuthStore.getState().user;
    const isAdmin = user && user.role === 'admin';

    if (this.state.hasError) {
      // UI de fallback para todos los usuarios
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50">
          <div className="bg-white p-10 rounded-lg shadow-xl max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Algo salió mal.</h1>
            <p className="text-gray-600 mb-8">
              Hemos registrado el problema y estamos trabajando para solucionarlo. Por favor, intenta recargar la página.
            </p>
            <button onClick={() => window.location.reload()} className="bg-[#0F3460] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a4a8a]">
              Recargar Página
            </button>
            {isAdmin && (
              <AIErrorAnalysisModal 
                isOpen={this.state.showModal}
                onClose={this.handleCloseModal}
                error={this.state.error}
                errorInfo={this.state.errorInfo}
                analysis={this.state.analysis}
                loading={this.state.loadingAnalysis}
              />
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

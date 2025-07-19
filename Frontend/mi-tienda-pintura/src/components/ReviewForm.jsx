// src/components/ReviewForm.jsx
import React, { useState } from 'react';
// --- 1. Importar apiFetch ---
import { apiFetch } from '../api';
import { useNotificationStore } from '../stores/useNotificationStore';


const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const showNotification = useNotificationStore(state => state.showNotification);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor, selecciona una calificación.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // --- 2. Usar apiFetch en lugar de fetch ---
      // Ya no es necesario pasar el token manualmente.
      const response = await apiFetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar la reseña');
      }
      
      showNotification('¡Gracias por tu reseña!', 'success');
      // Limpiar formulario y notificar al padre para que actualice la lista
      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-8">
      <h3 className="text-xl font-bold mb-4">Escribe tu reseña</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Tu calificación:</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className={`w-8 h-8 cursor-pointer ${
                  (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="comment" className="block font-medium mb-2">Tu comentario:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]"
            rows="4"
          ></textarea>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="text-right">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400">
            {loading ? 'Enviando...' : 'Enviar Reseña'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;

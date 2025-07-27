// src/components/ReviewList.jsx
import React from 'react';
import StarRating from './StarRating';

// El componente ahora recibe el usuario actual y una función onDelete
const ReviewList = ({ reviews, user, onDelete }) => {
  if (reviews.length === 0) {
    return <p className="text-gray-500">Todavía no hay reseñas para este producto. ¡Sé el primero!</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        // Comprobamos si se debe mostrar el botón de eliminar.
        // La condición es: (hay un usuario logueado) Y (es un admin O es el dueño de la reseña)
        const canDelete = user && (user.role === 'admin' || user.userId === review.user_id);

        return (
          <div key={review.id} className="border-b pb-4">
            <div className="flex items-center mb-2">
              <StarRating rating={review.rating} />
              <p className="ml-4 font-bold text-gray-800">{review.first_name} {review.last_name}</p>
            </div>
            {/* El contenido de 'review.comment' se escapa automáticamente por React al ser renderizado en JSX.
              Además, en el backend, el middleware de validación aplica .escape() para sanitizar este campo.
            */}
            <p className="text-gray-600 mb-1">{review.comment}</p>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString('es-AR')}
              </p>
              {/* Si el usuario tiene permiso, mostramos el botón */}
              {canDelete && (
                <button 
                  onClick={() => onDelete(review.id)} 
                  className="text-xs text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;

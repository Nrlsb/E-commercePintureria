// src/components/ReviewList.jsx
import React from 'react';
import StarRating from './StarRating';

const ReviewList = ({ reviews }) => {
  if (reviews.length === 0) {
    return <p className="text-gray-500">Todavía no hay reseñas para este producto. ¡Sé el primero!</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-4">
          <div className="flex items-center mb-2">
            <StarRating rating={review.rating} />
            <p className="ml-4 font-bold text-gray-800">{review.first_name} {review.last_name}</p>
          </div>
          <p className="text-gray-600 mb-1">{review.comment}</p>
          <p className="text-xs text-gray-400">
            {new Date(review.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;

import React from 'react';

interface ToastContainerProps {
  errors: any[];
  onRemoveError: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

export function ToastContainer({ 
  errors, 
  onRemoveError, 
  position = 'top-right',
  maxToasts = 5 
}: ToastContainerProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2`}>
      {errors.slice(0, maxToasts).map((error, index) => (
        <div
          key={error.id || index}
          className="bg-red-500 text-white px-4 py-3 rounded-md shadow-lg max-w-sm"
        >
          <div className="flex justify-between items-start">
            <p className="text-sm">{error.message || 'An error occurred'}</p>
            <button
              onClick={() => onRemoveError(error.id || index)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
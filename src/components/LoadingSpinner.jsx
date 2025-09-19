import React from 'react';

const LoadingSpinner = React.memo(function LoadingSpinner({ 
  size = 'large', 
  message = 'Cargando...', 
  className = '' 
}) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} role="status" aria-live="polite">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}>
        <span className="sr-only">{message}</span>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
});

export default LoadingSpinner;
import React from 'react';

const LoadingOverlay = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center max-w-sm mx-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
        <p className="mt-4 text-primary-700 font-semibold text-center">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;

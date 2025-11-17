import React, { useEffect } from 'react';

const Notification = ({ notification, onClear }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClear();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClear]);

  if (!notification) return null;

  const bgColor = notification.type === 'success' 
    ? 'bg-green-500' 
    : notification.type === 'error' 
    ? 'bg-red-500' 
    : 'bg-primary-500';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-md mx-4`}>
        <div className="flex items-center gap-3">
          {notification.type === 'success' && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {notification.type === 'error' && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <p className="font-medium">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};

export default Notification;

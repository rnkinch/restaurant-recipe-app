import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-bootstrap';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration = 5000) => {
    return addNotification(message, 'success', duration);
  };

  const showError = (message, duration = 8000) => {
    return addNotification(message, 'danger', duration);
  };

  const showWarning = (message, duration = 6000) => {
    return addNotification(message, 'warning', duration);
  };

  const showInfo = (message, duration = 5000) => {
    return addNotification(message, 'info', duration);
  };

  const confirm = (message) => {
    return window.confirm(message);
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirm
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
        {notifications.map(notification => (
          <Alert
            key={notification.id}
            variant={notification.type}
            dismissible
            onClose={() => removeNotification(notification.id)}
            style={{ marginBottom: '10px', minWidth: '300px' }}
          >
            {notification.message}
          </Alert>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

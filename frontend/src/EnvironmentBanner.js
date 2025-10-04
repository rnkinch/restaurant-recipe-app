import React from 'react';

const EnvironmentBanner = () => {
  // Get environment from custom environment variable
  const environment = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV;
  
  // Don't show banner in production
  if (environment === 'production') {
    return null;
  }

  // Map environment names to display names and colors
  const getEnvironmentConfig = (env) => {
    switch (env) {
      case 'development':
        return {
          name: 'DEV',
          color: '#28a745', // Green
          backgroundColor: '#d4edda'
        };
      case 'staging':
        return {
          name: 'STAGING',
          color: '#fd7e14', // Orange
          backgroundColor: '#fff3cd'
        };
      default:
        return {
          name: env ? env.toUpperCase() : 'UNKNOWN',
          color: '#6c757d', // Gray
          backgroundColor: '#f8f9fa'
        };
    }
  };

  const config = getEnvironmentConfig(environment);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: config.backgroundColor,
        color: config.color,
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        borderTop: `2px solid ${config.color}`,
        zIndex: 1000,
        fontFamily: 'monospace',
        letterSpacing: '1px'
      }}
    >
      ENVIRONMENT: {config.name}
    </div>
  );
};

export default EnvironmentBanner;

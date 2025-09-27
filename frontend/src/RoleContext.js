import React, { createContext, useContext } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children, user }) => {
  const canEdit = user && user.role && user.role !== 'readonly' && user.isActive;
  const isAdmin = user && user.role === 'admin';
  const isReadOnly = user && user.role === 'readonly';
  const isUser = user && user.role === 'user';

  const value = {
    user,
    canEdit,
    isAdmin,
    isReadOnly,
    isUser,
    role: user?.role || 'readonly'
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

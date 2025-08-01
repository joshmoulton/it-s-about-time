import React, { createContext, useContext, useMemo } from 'react';
import { useAdminStatus } from './useAdminStatus';

interface AdminStatusContextType {
  isAdmin: boolean;
  isLoading: boolean;
}

const AdminStatusContext = createContext<AdminStatusContextType | undefined>(undefined);

export const AdminStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminStatus = useAdminStatus();
  
  const value = useMemo(() => ({
    isAdmin: adminStatus.isAdmin,
    isLoading: adminStatus.isLoading,
  }), [adminStatus.isAdmin, adminStatus.isLoading]);

  return (
    <AdminStatusContext.Provider value={value}>
      {children}
    </AdminStatusContext.Provider>
  );
};

export const useAdminStatusFromContext = (): AdminStatusContextType => {
  const context = useContext(AdminStatusContext);
  if (context === undefined) {
    throw new Error('useAdminStatusFromContext must be used within an AdminStatusProvider');
  }
  return context;
};
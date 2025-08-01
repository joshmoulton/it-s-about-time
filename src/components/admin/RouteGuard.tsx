import React from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessRoute } from '@/utils/adminPermissions';

interface AdminUser {
  id: string;
  role: string;
  permissions: any;
  is_active: boolean;
}

interface RouteGuardProps {
  children: React.ReactNode;
  adminUser: AdminUser;
  route: string;
}

export function RouteGuard({ children, adminUser, route }: RouteGuardProps) {
  if (!canAccessRoute(adminUser, route)) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
}
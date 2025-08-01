import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserManagement } from '@/components/admin/sections/UserManagement';

export default function SecureUserManagement() {
  const { subscriber, currentUser, isLoading: authLoading, isAuthenticated } = useEnhancedAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  
  const isLoading = authLoading || adminLoading;

  console.log('🔒 Secure User Management access attempt:', { 
    subscriber: subscriber?.email, 
    currentUser: currentUser?.email,
    userType: currentUser?.user_type,
    isAuthenticated,
    isAdmin,
    authLoading,
    adminLoading,
    totalLoading: isLoading
  });

  // Show loading for a shorter time
  if (isLoading) {
    console.log('⏳ Secure User Management loading');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Super admin access check - allow both supabase_admin and whop_admin super admins
  if (!isLoading && isAuthenticated && !isAdmin) {
    console.log('🚫 Insufficient admin privileges for secure user management', {
      isAuthenticated,
      isAdmin,
      userType: currentUser?.user_type,
      email: currentUser?.email
    });
    return <Navigate to="/dashboard" replace />;
  }

  // Create admin user with proper email handling
  const mockAdminUser = {
    id: currentUser?.id || 'temp-admin-id',
    role: 'super_admin',
    permissions: {},
    is_active: true,
    email: currentUser?.email || 'admin@example.com',
    user_type: 'supabase_admin'
  };

  // Create subscriber with fallback
  const currentSubscriber = subscriber || {
    id: currentUser?.id || 'temp-subscriber-id',
    email: currentUser?.email || 'admin@example.com',
    status: 'active',
    subscription_tier: 'premium' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('✅ Secure User Management access granted for:', currentUser?.email || 'fallback admin');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-900">
        <AdminSidebar adminUser={mockAdminUser} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Secure User Management</h1>
              <p className="text-slate-400">Advanced user administration panel</p>
            </div>
            <UserManagement />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminContent } from '@/components/admin/AdminContent';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Admin() {
  const { subscriber, currentUser, isLoading: authLoading } = useEnhancedAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  
  const isLoading = authLoading || adminLoading;

  // Only log significant state changes to reduce console noise
  const shouldLogState = React.useRef({ 
    lastAdmin: isAdmin, 
    lastLoading: isLoading,
    logCount: 0 
  });
  
  if (shouldLogState.current.lastAdmin !== isAdmin || 
      shouldLogState.current.lastLoading !== isLoading ||
      shouldLogState.current.logCount < 1) {
    console.log('🏛️ Admin page render:', { 
      isAdmin,
      authLoading,
      adminLoading
    });
    shouldLogState.current = { lastAdmin: isAdmin, lastLoading: isLoading, logCount: 1 };
  }

  // Reduced loading timeout for faster access
  const [showTimeout, setShowTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Admin loading timeout reached');
        setShowTimeout(true);
      }
    }, 2000); // Reduced to 2 seconds

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Show loading for a shorter time
  if (isLoading && !showTimeout) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-slate-300">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!isLoading && !currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin access check - use database function instead of hardcoded user_type
  if (!isLoading && currentUser && !isAdmin) {
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

  // Create subscriber with fallback - needed for some legacy components
  const currentSubscriber = subscriber || {
    id: currentUser?.id || 'temp-subscriber-id',
    email: currentUser?.email || 'admin@example.com',
    status: 'active',
    subscription_tier: 'premium' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Removed verbose logging to improve performance

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950 text-white">
        <AdminSidebar adminUser={mockAdminUser} />
        <main className="flex-1 overflow-auto bg-slate-950">
          <div className="p-4 sm:p-6 lg:p-8 ml-2 lg:ml-4">
            <AdminContent adminUser={mockAdminUser} subscriber={currentSubscriber} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

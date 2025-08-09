
import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/secureLogger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: 'free' | 'paid' | 'premium';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredTier = 'free' 
}) => {
  const DISABLE_AUTH = false;
  const [authTimeout, setAuthTimeout] = useState(false);

  if (DISABLE_AUTH) {
    return <>{children}</>;
  }

  const { isAuthenticated, currentUser, isLoading } = useEnhancedAuth();
  const { isAdmin } = useAdminStatus();
  
  // Only log state changes when they actually change for debugging
  const stateRef = useRef<any>(null);
  const currentState = { isAuthenticated, currentUser: currentUser?.email, userType: currentUser?.user_type, isAdmin, isLoading };
  
  if (JSON.stringify(stateRef.current) !== JSON.stringify(currentState)) {
    logger.info('ProtectedRoute state change', currentState);
    stateRef.current = currentState;
  }

  // Grace period after magic-link verification to avoid redirect loops
  const justLoggedInAt = Number(sessionStorage.getItem('ww.justLoggedIn') || '0');
  const withinGrace = justLoggedInAt > 0 && Date.now() - justLoggedInAt < 10000;

  // Reduced timeout for faster UX
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        logger.warn('Auth timeout reached');
        setAuthTimeout(true);
      }
    }, 3000); // Reduced from 5 to 3 seconds for faster feedback

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Reset timeout once auth resolves to prevent false redirects
  useEffect(() => {
    if (isAuthenticated || !isLoading) {
      setAuthTimeout(false);
    }
  }, [isAuthenticated, isLoading]);

  // Clear grace flag once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.removeItem('ww.justLoggedIn');
    }
  }, [isAuthenticated]);

  // Grant immediate access for admins (determined by database function)
  if (isAdmin) {
    logger.info('Admin access granted immediately');
    return children;
  }
  // Show loading only briefly
  if (isLoading && !authTimeout) {
    logger.info('Showing auth loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If within grace window after login, show a brief loader to allow auth to settle
  if (!isAuthenticated && withinGrace) {
    logger.info('Within post-login grace period, showing brief loader');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Finalizing sign-in...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login once loading completes or after timeout
  if (!isAuthenticated && (authTimeout || !isLoading) && !withinGrace) {
    logger.warn('Not authenticated (post-load or timeout), redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // For regular users, check subscription tier (simplified - focus on Whop users)
  if (currentUser && requiredTier !== 'free') {
    const tierLevels = { free: 0, paid: 1, premium: 2 };
    const userTierLevel = tierLevels[currentUser.subscription_tier || 'free'];
    const requiredTierLevel = tierLevels[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      logger.warn('Insufficient tier, redirecting to pricing');
      return <Navigate to="/pricing" replace />;
    }
  }

  logger.info('Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;

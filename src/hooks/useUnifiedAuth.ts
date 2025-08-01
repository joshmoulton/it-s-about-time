import { useState, useEffect, useCallback } from 'react';
import { UnifiedAuth, UnifiedSession } from '@/utils/unifiedAuthUtils';

export interface UnifiedUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  user_type: 'unified_user';
  source: 'beehiiv' | 'whop' | 'both' | 'none';
  verified_at: string;
  permissions: {
    canViewBasicSignals: boolean;
    canSendTelegramMessages: boolean;
    canAccessAnalytics: boolean;
    canAccessPremiumContent: boolean;
    dailyMessageLimit: number;
  };
}

export interface UseUnifiedAuthReturn {
  user: UnifiedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
}

export function useUnifiedAuth(): UseUnifiedAuthReturn {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert session to user object
  const sessionToUser = useCallback((session: UnifiedSession): UnifiedUser => {
    const permissions = UnifiedAuth.getUserPermissions(session.tier);
    
    return {
      id: `unified-${session.email}`, // Generate consistent ID
      email: session.email,
      subscription_tier: session.tier,
      user_type: 'unified_user',
      source: session.source,
      verified_at: session.verified_at,
      permissions
    };
  }, []);

  // Check current session and set user
  const checkSession = useCallback(async () => {
    try {
      const session = UnifiedAuth.getCurrentSession();
      
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Check if session needs refresh
      if (UnifiedAuth.needsRefresh(session)) {
        console.log('🔄 UNIFIED AUTH HOOK: Session needs refresh');
        const refreshedSession = await UnifiedAuth.refreshSession(session.email);
        
        if (refreshedSession) {
          setUser(sessionToUser(refreshedSession));
        } else {
          setUser(null);
        }
      } else {
        setUser(sessionToUser(session));
      }
    } catch (error) {
      console.error('🔄 UNIFIED AUTH HOOK: Session check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToUser]);

  // Login function
  const login = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const result = await UnifiedAuth.performLogin(email);
      
      if (result.success && result.session) {
        setUser(sessionToUser(result.session));
      }
      
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('🔄 UNIFIED AUTH HOOK: Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [sessionToUser]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Immediately redirect to prevent auth popup
      window.location.href = '/';
      
      // Then clear auth in background
      await UnifiedAuth.performLogout();
      setUser(null);
    } catch (error) {
      console.error('🔄 UNIFIED AUTH HOOK: Logout error:', error);
      // Always redirect even if logout fails
      window.location.href = '/';
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      const refreshedSession = await UnifiedAuth.refreshSession(user.email);
      
      if (refreshedSession) {
        setUser(sessionToUser(refreshedSession));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('🔄 UNIFIED AUTH HOOK: Refresh error:', error);
    }
  }, [user, sessionToUser]);

  // Check feature access
  const checkFeatureAccess = useCallback((feature: string): boolean => {
    if (!user) return false;
    return UnifiedAuth.requiresTier(feature, user.subscription_tier);
  }, [user]);

  // Initialize auth state on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Set up periodic session check (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkSession();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user, checkSession]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    checkFeatureAccess
  };
}
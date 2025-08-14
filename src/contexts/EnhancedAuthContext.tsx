
import React, { createContext, useContext, ReactNode, useMemo, useRef, useEffect } from 'react';
import { useDeveloperOverride } from '@/components/dev/DeveloperToggle';
import { AuthContextType } from '@/types/auth';
import { useEnhancedAuthState } from '@/hooks/useEnhancedAuthState';
import { useEnhancedAuthInitialization } from '@/hooks/useEnhancedAuthInitialization';
import { useEnhancedAuthActions } from '@/hooks/useEnhancedAuthActions';
import { userPreferences } from '@/utils/userPreferencesSync';
import { logger } from '@/utils/secureLogger';

const EnhancedAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (context === undefined) {
    // Return a safe default during SSR or initial render instead of throwing
    return {
      isLoading: true,
      isAuthenticated: false,
      currentUser: null,
      subscriber: null,
      supabaseUser: null,
      login: async () => false,
      logout: async () => {},
      refreshCurrentUser: async () => {},
      setAuthenticatedUser: () => {},
      authenticatedUser: null,
      subscriberExists: false,
      subscriberTier: 'free' as const,
      originalTier: 'free' as const,
      overrideTier: null,
      isOverrideActive: false,
      currentUserExists: false,
      authMethod: null,
      userEmail: null,
      userType: null
    };
  }
  return context;
};

interface EnhancedAuthProviderProps {
  children: ReactNode;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  // Try to get developer override, but handle if context doesn't exist
  let overrideTier = null;
  try {
    const { overrideTier: devOverride } = useDeveloperOverride();
    overrideTier = devOverride;
  } catch (error) {
    // Developer context not available, use null
    overrideTier = null;
  }
  const {
    isLoading,
    setIsLoading,
    currentUser,
    setCurrentUser,
    supabaseUser,
    setSupabaseUser,
    setAuthenticatedUser,
    refreshCurrentUser
  } = useEnhancedAuthState();

  const { login, logout } = useEnhancedAuthActions({
    setCurrentUser,
    setSupabaseUser,
    setIsLoading
  });

  // Sync user preferences when auth state changes
  useEffect(() => {
    if (currentUser?.email) {
      userPreferences.setCurrentUser(currentUser.email);
    } else {
      userPreferences.setCurrentUser(null);
    }
  }, [currentUser?.email]);

  // Enhanced logout with preference clearing
  const enhancedLogout = async () => {
    userPreferences.clearUserPreferences();
    await logout();
  };

  // Initialize authentication state
  useEnhancedAuthInitialization({
    setCurrentUser,
    setSupabaseUser,
    setIsLoading
  });

  const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);

  // ✅ Performance: Only log auth state changes in development
  const prevAuthState = useRef({ isAuthenticated: false, email: null as string | null });
  
  if (import.meta.env.DEV && 
      (prevAuthState.current.isAuthenticated !== isAuthenticated || 
       prevAuthState.current.email !== currentUser?.email)) {
    console.log('🔄 Auth state change:', { 
      isAuthenticated, 
      email: currentUser?.email,
      method: localStorage.getItem('auth_method')
    });
    prevAuthState.current = { isAuthenticated, email: currentUser?.email };
  }

  // Stable memoized context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => {
    // Create subscriber object from currentUser for compatibility
    const subscriber = currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      status: currentUser.status || 'active',
      subscription_tier: overrideTier || currentUser.subscription_tier || 'free',
      created_at: currentUser.created_at || new Date().toISOString(),
      updated_at: currentUser.updated_at || new Date().toISOString(),
      metadata: currentUser.metadata
    } : null;

    return {
      subscriber,
      currentUser,
      isLoading,
      login,
      logout: enhancedLogout,
      isAuthenticated,
      setAuthenticatedUser,
      refreshCurrentUser
    };
  }, [
    currentUser?.id, 
    currentUser?.email, 
    currentUser?.subscription_tier,
    isLoading, 
    isAuthenticated, 
    overrideTier
  ]);

  // Performance optimized - remove final state logging

  return <EnhancedAuthContext.Provider value={value}>{children}</EnhancedAuthContext.Provider>;
};

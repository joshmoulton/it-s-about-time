
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

  // Only log auth state changes when they actually change
  const isAuthenticatedRef = useRef(false);
  const currentUserEmailRef = useRef<string | null>(null);
  
  if (isAuthenticatedRef.current !== isAuthenticated || currentUserEmailRef.current !== currentUser?.email) {
    logger.info('Auth state change', { 
      isLoading, 
      currentUser: currentUser?.email,
      authMethod: localStorage.getItem('auth_method')
    });
    isAuthenticatedRef.current = isAuthenticated;
    currentUserEmailRef.current = currentUser?.email || null;
  }

  // Memoize context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => {
    // Create subscriber object from currentUser for compatibility
    // Ensure subscriber is null for non-authenticated users or has proper tier
    const subscriber = currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      status: currentUser.status || 'active',
      // Apply developer override if set, otherwise use current tier
      subscription_tier: overrideTier || currentUser.subscription_tier || 'free',
      created_at: currentUser.created_at || new Date().toISOString(),
      updated_at: currentUser.updated_at || new Date().toISOString(),
      metadata: currentUser.metadata
    } : null;

    // Debug logging for freemium wrapper
    console.log('🔍 EnhancedAuthContext: Context value', {
      isAuthenticated,
      isLoading,
      currentUserExists: !!currentUser,
      subscriberExists: !!subscriber,
      subscriberTier: subscriber?.subscription_tier,
      originalTier: currentUser?.subscription_tier,
      overrideTier,
      isOverrideActive: !!overrideTier,
      authMethod: localStorage.getItem('auth_method'),
      userEmail: currentUser?.email,
      userType: currentUser?.user_type
    });

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
  }, [currentUser, isLoading, isAuthenticated, login, enhancedLogout, setAuthenticatedUser, refreshCurrentUser, overrideTier]);

  // Only log final state changes when they actually change
  const finalStateRef = useRef<any>(null);
  const currentFinalState = { isAuthenticated, isLoading, userType: currentUser?.user_type, email: currentUser?.email };
  
  if (JSON.stringify(finalStateRef.current) !== JSON.stringify(currentFinalState)) {
    logger.info('Auth final state', currentFinalState);
    finalStateRef.current = currentFinalState;
  }

  return <EnhancedAuthContext.Provider value={value}>{children}</EnhancedAuthContext.Provider>;
};

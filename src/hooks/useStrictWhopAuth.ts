import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StrictWhopUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'premium';
  has_active_purchase: boolean;
  purchase_verified_at: string;
}

export interface StrictWhopAuthState {
  isAuthenticated: boolean;
  user: StrictWhopUser | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Strict Whop authentication hook with NO fallback logic
 * Users must have valid Whop authentication and their purchase status determines access
 */
export const useStrictWhopAuth = () => {
  const [authState, setAuthState] = useState<StrictWhopAuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  });

  /**
   * Verify user's Whop authentication and purchase status
   * NO fallbacks - must have valid Whop data
   */
  const verifyWhopAuth = useCallback(async (email: string): Promise<StrictWhopUser | null> => {
    try {
      console.log('🔍 Strict Whop verification for:', email);
      
      // REQUIREMENT 1: User must exist in whop_authenticated_users
      const { data: whopUser, error: whopError } = await supabase
        .from('whop_authenticated_users')
        .select('*')
        .eq('user_email', email)
        .single();

      if (whopError || !whopUser) {
        console.log('❌ STRICT: User not in whop_authenticated_users');
        return null;
      }

      // REQUIREMENT 2: Check for active Whop purchases (premium tier)
      const { data: purchases, error: purchaseError } = await supabase
        .from('whop_purchases')
        .select('*')
        .eq('customer_email', email)
        .eq('status', 'active');

      if (purchaseError) {
        console.error('❌ STRICT: Purchase verification failed:', purchaseError);
        return null;
      }

      // STRICT LOGIC: Premium tier ONLY if active purchases exist
      const hasActivePurchase = purchases && purchases.length > 0;
      const subscription_tier: 'free' | 'premium' = hasActivePurchase ? 'premium' : 'free';

      console.log('✅ STRICT Whop verification complete:', {
        email,
        whopUserId: whopUser.whop_user_id,
        hasActivePurchase,
        subscription_tier,
        activePurchases: purchases?.length || 0
      });

      return {
        id: whopUser.whop_user_id,
        email: whopUser.user_email,
        subscription_tier,
        has_active_purchase: hasActivePurchase,
        purchase_verified_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ STRICT: Whop verification failed:', error);
      return null;
    }
  }, []);

  /**
   * Check if user has access to premium features
   */
  const hasPremiumAccess = useCallback((): boolean => {
    return authState.isAuthenticated && 
           authState.user?.subscription_tier === 'premium' && 
           authState.user?.has_active_purchase === true;
  }, [authState]);

  /**
   * Initialize authentication - check for existing valid session
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if we have a current user email from any auth method
      let userEmail: string | null = null;

      // Method 1: Check Supabase auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        userEmail = session.user.email;
        console.log('📧 Found Supabase session email:', userEmail);
      }

      // Method 2: Check cached Whop email
      if (!userEmail) {
        userEmail = localStorage.getItem('whop_user_email');
        if (userEmail) {
          console.log('📧 Found cached Whop email:', userEmail);
        }
      }

      if (!userEmail) {
        console.log('❌ STRICT: No user email found - not authenticated');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null
        });
        return;
      }

      // Verify Whop authentication strictly
      const whopUser = await verifyWhopAuth(userEmail);
      
      if (whopUser) {
        console.log('✅ STRICT: Whop authentication valid');
        setAuthState({
          isAuthenticated: true,
          user: whopUser,
          isLoading: false,
          error: null
        });
        
        // Cache the verified email
        localStorage.setItem('whop_user_email', userEmail);
      } else {
        console.log('❌ STRICT: Whop authentication failed');
        // Clear any cached data for failed verification
        localStorage.removeItem('whop_user_email');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Whop authentication required'
        });
      }

    } catch (error) {
      console.error('❌ STRICT: Auth initialization failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  }, [verifyWhopAuth]);

  /**
   * Refresh user's purchase status
   */
  const refreshPurchaseStatus = useCallback(async (): Promise<boolean> => {
    if (!authState.user?.email) {
      return false;
    }

    try {
      console.log('🔄 Refreshing purchase status for:', authState.user.email);
      
      const updatedUser = await verifyWhopAuth(authState.user.email);
      if (updatedUser) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Purchase status refresh failed:', error);
      return false;
    }
  }, [authState.user?.email, verifyWhopAuth]);

  /**
   * Logout - clear all auth data
   */
  const logout = useCallback(() => {
    console.log('🚪 STRICT: Logging out');
    localStorage.removeItem('whop_user_email');
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null
    });
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    ...authState,
    hasPremiumAccess,
    refreshPurchaseStatus,
    logout,
    initializeAuth
  };
};
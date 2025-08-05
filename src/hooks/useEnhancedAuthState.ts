
import { useState, useCallback } from 'react';
import { CurrentUser } from '@/types/auth';

export const useEnhancedAuthState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  const setAuthenticatedUser = useCallback((user: any, authMethod: string) => {
    console.log('✅ setAuthenticatedUser called:', user.email, 'Method:', authMethod);
    console.log('🎯 Input user tier:', user.subscription_tier);
    console.log('🔍 Input user data:', user);
    
    // Store auth method
    localStorage.setItem('auth_method', authMethod);
    
    // CRITICAL: Ensure premium Whop users keep their premium tier
    let finalTier = user.subscription_tier;
    if (authMethod === 'whop' && !finalTier) {
      // If no tier specified for Whop user, check has_whop_purchase
      finalTier = user.has_whop_purchase ? 'premium' : 'free';
      console.log('🔍 Whop user tier correction - has_whop_purchase:', user.has_whop_purchase, 'Final tier:', finalTier);
    }
    
    const currentUserData = {
      id: user.id,
      email: user.email,
      subscription_tier: finalTier,
      user_type: authMethod === 'password' || authMethod === 'whop' ? 'whop_user' as const : 'supabase_admin' as const,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      metadata: user.metadata
    };
    
    console.log('🎯 Final currentUserData tier:', currentUserData.subscription_tier);
    console.log('🎯 Complete final currentUserData:', currentUserData);
    setCurrentUser(currentUserData);
    setIsLoading(false);
  }, []);

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    
    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      if (currentUser.user_type === 'whop_user') {
        // For Whop users, refresh from whop_authenticated_users with optimized query
        const { data, error } = await supabase
          .from('whop_authenticated_users')
          .select('subscription_tier, updated_at')
          .eq('user_email', currentUser.email)
          .single();
        
        if (error) {
          console.warn('Failed to refresh Whop user data:', error);
          return;
        }
        
        if (data) {
          const refreshedUserData = {
            ...currentUser,
            subscription_tier: data.subscription_tier,
            updated_at: data.updated_at
          };
          setCurrentUser(refreshedUserData);
        }
      } else {
        // For Supabase admin users, profile data is managed separately via user_profiles table
        // No need to refresh from subscriber tables frequently
        console.log('Supabase admin user - using cached data to improve performance');
      }
    } catch (error) {
      console.error('Failed to refresh current user:', error);
    }
  };

  return {
    isLoading,
    setIsLoading,
    currentUser,
    setCurrentUser,
    supabaseUser,
    setSupabaseUser,
    setAuthenticatedUser,
    refreshCurrentUser
  };
};

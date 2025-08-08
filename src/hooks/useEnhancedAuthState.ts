
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
    
    // Normalize tier to two-tier system
    const finalTier = (user.subscription_tier === 'free' ? 'free' : 'premium') as 'free' | 'premium';
    
    const currentUserData = {
      id: user.id,
      email: user.email,
      subscription_tier: finalTier,
      user_type: authMethod === 'supabase_admin' ? 'supabase_admin' as const : 'unified_user' as const,
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
    
    console.log('🔄 Refreshing current user data...');
    
    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Always verify against Beehiiv for current tier
      if (currentUser.email) {
        const { data: verificationResult, error: verifyError } = await supabase.functions.invoke(
          'beehiiv-subscriber-verify',
          { body: { email: currentUser.email.toLowerCase().trim() } }
        );

        if (!verifyError && verificationResult?.success) {
          const updatedTierRaw = (verificationResult.tier as 'free' | 'paid' | 'premium') || 'free';
          const updatedTier = (updatedTierRaw === 'free' ? 'free' : 'premium') as 'free' | 'premium';
          
          const refreshedUserData: CurrentUser = {
            ...currentUser,
            subscription_tier: updatedTier,
            updated_at: new Date().toISOString()
          };
          
          setCurrentUser(refreshedUserData);
          console.log(`✅ User tier refreshed to: ${updatedTier} (raw: ${updatedTierRaw})`);
        }
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

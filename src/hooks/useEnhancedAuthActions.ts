
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimplifiedAuth } from '@/utils/simplifiedAuthUtils';
import { CurrentUser } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

interface UseEnhancedAuthActionsProps {
  setCurrentUser: (user: CurrentUser | null) => void;
  setSupabaseUser: (user: any) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useEnhancedAuthActions = ({
  setCurrentUser,
  setSupabaseUser,
  setIsLoading
}: UseEnhancedAuthActionsProps) => {
  const navigate = useNavigate();
  
  // Enhanced login function that always verifies Beehiiv subscription
  const login = useCallback(async (email: string): Promise<{ 
    success: boolean; 
    error?: string; 
    requiresPasswordSetup?: boolean;
    userTier?: string;
  }> => {
    setIsLoading(true);
    
    try {
      // First, verify with Beehiiv to get current subscription status
      const { data: verificationResult, error: verifyError } = await supabase.functions.invoke(
        'unified-auth-verify',
        { body: { email } }
      );

      if (verifyError) {
        throw new Error('Failed to verify subscription status');
      }

      if (!verificationResult?.verified) {
        throw new Error('No active subscription found for this email');
      }

      // Check if user needs password setup
      const { data: subscriber, error: subscriberError } = await supabase
        .from('beehiiv_subscribers')
        .select('requires_password_setup, subscription_tier')
        .eq('email', email)
        .single();

      if (subscriberError) {
        console.error('Error checking subscriber:', subscriberError);
      }

      const requiresPasswordSetup = subscriber?.requires_password_setup ?? false;
      const userTier = verificationResult.tier || subscriber?.subscription_tier || 'free';

      // Set the current user
      const userData: CurrentUser = {
        id: crypto.randomUUID(),
        email,
        subscription_tier: userTier as any,
        user_type: 'unified_user'
      };

      setCurrentUser(userData);

      console.log(`✅ Login successful for ${email}, tier: ${userTier}, requires password setup: ${requiresPasswordSetup}`);

      return { 
        success: true, 
        requiresPasswordSetup,
        userTier
      };

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser, setIsLoading]);

  // Enhanced logout with cache clearing
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting enhanced logout...');
      
      // Clear browser caches but preserve tour completion flags first
      const tourKeys = Object.keys(localStorage).filter(key => key.startsWith('weekly-wizdom-tour-'));
      const tourData: { [key: string]: string } = {};
      tourKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) tourData[key] = value;
      });
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore tour completion flags
      Object.entries(tourData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      // Clear form data
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (form.reset) form.reset();
      });
      
      // Clear Supabase auth session in background
      await supabase.auth.signOut({ scope: 'local' });
      
      // Immediately redirect to prevent any brief login screen flash
      window.location.href = '/';
      
      console.log('✅ Enhanced logout completed');
    } catch (error) {
      console.error('❌ Enhanced logout error:', error);
      // Still redirect to landing page even on error
      window.location.href = '/';
    }
  }, []);

  return { login, logout };
};

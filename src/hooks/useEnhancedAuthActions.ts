
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
  // Enhanced login function
  const login = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    console.warn('Legacy login called - use EnhancedLoginForm instead');
    return { success: false, error: 'Please use the enhanced login form' };
  }, []);

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

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureSession = () => {
  const validateSession = useCallback(async () => {
    try {
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Session validation error:', error.message);
        return false;
      }
      
      if (!session?.session) {
        return false;
      }
      
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = new Date(session.session.expires_at! * 1000);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        console.log('Session expires soon, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError.message);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, []);

  const secureSignOut = useCallback(async () => {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Secure sign out error:', error);
      // Force redirect even if sign out fails
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    // Validate session periodically
    const interval = setInterval(validateSession, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [validateSession]);

  return {
    validateSession,
    secureSignOut
  };
};
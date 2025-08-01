import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

// Global cache for admin status to prevent multiple checks
const adminStatusCache = new Map<string, { status: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ongoingChecks = new Map<string, Promise<boolean>>();

export const useAdminStatus = () => {
  const { currentUser, isLoading: authLoading } = useEnhancedAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedRef = useRef(false);
  const currentUserEmailRef = useRef<string | null>(null);

  // Memoize the user email to prevent unnecessary re-renders
  const userEmail = useMemo(() => currentUser?.email || null, [currentUser?.email]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userEmail || authLoading) {
        setIsAdmin(false);
        setIsLoading(authLoading);
        hasCheckedRef.current = false;
        return;
      }

      // Check cache first
      const cached = adminStatusCache.get(userEmail);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsAdmin(cached.status);
        setIsLoading(false);
        hasCheckedRef.current = true;
        currentUserEmailRef.current = userEmail;
        return;
      }

      // Check if there's already an ongoing check for this user
      let existingCheck = ongoingChecks.get(userEmail);
      if (existingCheck) {
        try {
          const result = await existingCheck;
          setIsAdmin(result);
          setIsLoading(false);
          hasCheckedRef.current = true;
          currentUserEmailRef.current = userEmail;
          return;
        } catch (error) {
          // Continue with new check if the existing one failed
        }
      }

      // Skip if we've already checked for this user recently
      if (hasCheckedRef.current && currentUserEmailRef.current === userEmail) {
        return;
      }

      const checkPromise = (async (): Promise<boolean> => {
        try {
          // Use the optimized admin check function
          const { data, error } = await supabase.rpc('is_current_user_admin_fast');

          if (error) {
            console.error('❌ Error checking admin status:', error);
            return false;
          }

          const isUserAdmin = !!data;
          
          // Cache the result
          adminStatusCache.set(userEmail, {
            status: isUserAdmin,
            timestamp: Date.now()
          });

          return isUserAdmin;
        } catch (error) {
          console.error('❌ Admin status check failed:', error);
          return false;
        } finally {
          ongoingChecks.delete(userEmail);
        }
      })();

      ongoingChecks.set(userEmail, checkPromise);

      try {
        const result = await checkPromise;
        setIsAdmin(result);
        hasCheckedRef.current = true;
        currentUserEmailRef.current = userEmail;
      } catch (error) {
        setIsAdmin(false);
        hasCheckedRef.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    // Reset check status when user changes
    if (currentUserEmailRef.current !== userEmail) {
      hasCheckedRef.current = false;
      // Clear 2FA session if user changed
      if (!userEmail) {
        localStorage.removeItem('admin_2fa_session');
      }
    }

    // Only check if we haven't checked for this user or user changed
    if (!hasCheckedRef.current || currentUserEmailRef.current !== userEmail) {
      setIsLoading(true);
      checkAdminStatus();
    }
  }, [userEmail, authLoading]);

  return { isAdmin, isLoading };
};
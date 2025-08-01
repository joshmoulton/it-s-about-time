import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhopAuthData {
  isWhopAuthenticated: boolean;
  whopUser: any | null;
  subscriptionTier: string | null;
  whopPurchaseId: string | null;
  isLoading: boolean;
}

export const useWhopAuth = () => {
  const [authData, setAuthData] = useState<WhopAuthData>({
    isWhopAuthenticated: false,
    whopUser: null,
    subscriptionTier: null,
    whopPurchaseId: null,
    isLoading: true
  });

  useEffect(() => {
    const checkWhopAuth = async () => {
      try {
        // Get current user email from Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.email) {
          setAuthData(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Check if user exists in whop_authenticated_users table
        const { data: whopUser, error } = await supabase
          .from('whop_authenticated_users')
          .select('*')
          .eq('user_email', session.user.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking Whop authentication:', error);
          setAuthData(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (whopUser) {
          // Check if access is still valid
          const now = new Date();
          const accessExpires = whopUser.access_expires_at ? new Date(whopUser.access_expires_at) : null;
          const isAccessValid = !accessExpires || accessExpires > now;

          setAuthData({
            isWhopAuthenticated: isAccessValid,
            whopUser: whopUser,
            subscriptionTier: whopUser.subscription_tier,
            whopPurchaseId: whopUser.whop_purchase_id,
            isLoading: false
          });
        } else {
          setAuthData(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error in Whop auth check:', error);
        setAuthData(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkWhopAuth();
  }, []);

  return authData;
};

export const useWhopAuthenticatedSync = () => {
  return async (newsletterId: string) => {
    try {
      // Call the authenticated sync function with Whop credentials
      const { data, error } = await supabase.functions.invoke('beehiiv-auth', {
        body: {
          action: 'sync_newsletter_authenticated',
          newsletter_id: newsletterId,
          use_whop_auth: true
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Whop authenticated sync failed:', error);
      throw error;
    }
  };
};
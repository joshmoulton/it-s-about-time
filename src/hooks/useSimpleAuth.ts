
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CurrentUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  user_type: 'unified_user';
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export const useSimpleAuth = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for localStorage auth first (magic link flow)
    const checkLocalStorageAuth = () => {
      const authEmail = localStorage.getItem('auth_user_email');
      const authMethod = localStorage.getItem('auth_method');
      const authVerifiedAt = localStorage.getItem('auth_verified_at');
      
      if (authEmail && authMethod === 'magic_link' && authVerifiedAt) {
        // Create a user object from localStorage data
        const localUser: CurrentUser = {
          id: `magic_link_${authEmail}`,
          email: authEmail,
          subscription_tier: 'free', // Default to free, will be updated by Beehiiv verification
          user_type: 'unified_user',
          status: 'active',
          created_at: authVerifiedAt,
          updated_at: authVerifiedAt,
          metadata: {
            auth_method: 'magic_link',
            verified_at: authVerifiedAt
          }
        };
        
        setUser(localUser);
        // Verify with Beehiiv to get subscription tier
        verifyUserWithBeehiiv(authEmail);
        return true;
      }
      return false;
    };

    // Get initial session
    const getSession = async () => {
      try {
        // First check for localStorage auth
        if (checkLocalStorageAuth()) {
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Initial session check:', { session: !!session, error });
        
        if (session?.user) {
          setSupabaseUser(session.user);
          await verifyUserWithBeehiiv(session.user.email!);
        }
      } catch (error) {
        console.error('❌ Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', { event, hasSession: !!session });
      
      if (session?.user) {
        setSupabaseUser(session.user);
        await verifyUserWithBeehiiv(session.user.email!);
      } else {
        setSupabaseUser(null);
        // Check localStorage before clearing user
        if (!checkLocalStorageAuth()) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  const verifyUserWithBeehiiv = async (email: string) => {
    try {
      console.log('🔍 Verifying user with Beehiiv:', email);
      
      // Always verify against Beehiiv API in real-time
      const { data, error } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
        body: { email: email.toLowerCase() }
      });

      if (error) {
        console.error('❌ Beehiiv verification error:', error);
        setUser(null);
        return;
      }

      if (data?.success && data?.verified) {
        const currentUser: CurrentUser = {
          id: `beehiiv_${email}`,
          email: email,
          subscription_tier: data.tier || 'free',
          user_type: 'unified_user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            source: data.source,
            verified_at: new Date().toISOString()
          }
        };

        console.log('✅ User verified with Beehiiv:', { tier: currentUser.subscription_tier, source: data.source });
        setUser(currentUser);
      } else {
        console.log('❌ User not verified with Beehiiv');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error verifying user:', error);
      setUser(null);
    }
  };

  const isAuthenticated = !!user; // Accept either Supabase auth or localStorage auth

  return {
    user,
    supabaseUser,
    isLoading,
    isAuthenticated
  };
};

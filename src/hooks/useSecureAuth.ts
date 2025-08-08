import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/secureLogger';

interface SecureAuthUser {
  id: string;
  email: string;
  tier: 'free' | 'premium';
  source: 'beehiiv' | 'whop' | 'both' | 'none';
  sessionToken?: string;
  verified: boolean;
}

interface UseSecureAuthReturn {
  user: SecureAuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useSecureAuth = (): UseSecureAuthReturn => {
  const [user, setUser] = useState<SecureAuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          await verifyAndSetUser(session.user.email!);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state change:', { event, email: session?.user?.email });
        
        if (session?.user) {
          setSupabaseUser(session.user);
          await verifyAndSetUser(session.user.email!);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const verifyAndSetUser = async (email: string) => {
    try {
      setIsLoading(true);
      
      // Verify with Beehiiv segments (pass-through only)
      const { data, error } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
        body: { email: email.toLowerCase().trim() }
      });

      if (error) {
        logger.error('Verification error:', error);
        throw error;
      }

      if (data.success) {
        const secureUser: SecureAuthUser = {
          id: supabaseUser?.id || crypto.randomUUID(),
          email,
          tier: data.tier === 'free' ? 'free' : 'premium',
          source: data.source,
          sessionToken: data.session_token,
          verified: true
        };

        setUser(secureUser);
        
        // Store minimal session info (no personal data)
        localStorage.setItem('auth_tier', data.tier);
        localStorage.setItem('auth_source', data.source);
        localStorage.setItem('auth_verified', 'true');
        
        logger.info('User verified and set:', { 
          tier: data.tier, 
          source: data.source,
          segments: data.metadata?.beehiiv_segments?.length || 0
        });
      } else {
        logger.warn('User verification failed:', data.error);
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      logger.error('User verification error:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      let authResult;
      
      if (password) {
        // Email/password login
        authResult = await supabase.auth.signInWithPassword({ email, password });
      } else {
        // Magic link login
        authResult = await supabase.auth.signInWithOtp({ 
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
      }

      if (authResult.error) {
        logger.error('Login error:', authResult.error);
        return { success: false, error: authResult.error.message };
      }

      // For magic link, we don't verify immediately
      if (!password) {
        logger.info('Magic link sent to:', email);
        return { success: true };
      }

      // For password login, verify immediately
      if (authResult.data.user) {
        await verifyAndSetUser(email);
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear local storage
      localStorage.removeItem('auth_tier');
      localStorage.removeItem('auth_source');
      localStorage.removeItem('auth_verified');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      setUser(null);
      setSupabaseUser(null);
      
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (supabaseUser?.email) {
      await verifyAndSetUser(supabaseUser.email);
    }
  };

  return {
    user,
    supabaseUser,
    isLoading,
    isAuthenticated: !!user && user.verified,
    login,
    logout,
    refreshUser
  };
};
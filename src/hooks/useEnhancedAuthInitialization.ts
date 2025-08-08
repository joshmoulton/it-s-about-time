
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { CurrentUser } from '@/types/auth';


interface UseEnhancedAuthInitializationProps {
  setCurrentUser: (user: CurrentUser | null) => void;
  setSupabaseUser: (user: any) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useEnhancedAuthInitialization = ({
  setCurrentUser,
  setSupabaseUser,
  setIsLoading
}: UseEnhancedAuthInitializationProps) => {
  const isInitialized = useRef(false);
  const authStateProcessing = useRef(false);

  // Clear any cached form data on mount
  useEffect(() => {
    // Clear browser form data caching
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.reset) form.reset();
    });
    
    // Clear any browser autocomplete data
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
      (input as HTMLInputElement).value = '';
      (input as HTMLInputElement).setAttribute('autocomplete', 'off');
    });
  }, []);

  // Optimized auth state handler with clear priority
  const handleAuthStateChange = useCallback((event: string, session: any) => {
    if (authStateProcessing.current) {
      console.log('🔄 Skipping auth event - already processing');
      return;
    }
    
    authStateProcessing.current = true;
    
    console.log('🔄 Processing auth state change:', event, session?.user?.email);
    
    try {
      if (session?.user) {
        console.log('✅ Supabase user session active:', session.user.email);
        setSupabaseUser(session.user);
        
        console.log('🔍 Determining user tier before setting state...');
        
        // CRITICAL FIX: Keep loading state until we determine the correct tier
        // Don't set a temporary user with 'free' tier to avoid showing wrong state
        setIsLoading(true);
        
        // Determine correct tier immediately without setTimeout to avoid race conditions
        setTimeout(async () => {
          try {
            // Quick admin check using our fast function
            const { data: isAdminResult } = await supabase.rpc('is_current_user_admin_fast');
            const isAdmin = !!isAdminResult;
            
            let subscriptionTier: 'free' | 'premium' = 'free';
            let userType: 'supabase_admin' | 'supabase_user' = 'supabase_user';
            
            if (isAdmin) {
              // Admin users get premium tier
              subscriptionTier = 'premium';
              userType = 'supabase_admin';
              localStorage.setItem('auth_method', 'supabase_admin');
              console.log('✅ Admin user detected - tier: premium');
            } else {
              // Beehiiv is the single source of truth for subscription tier
              try {
                const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
                  body: { email: session.user.email.toLowerCase().trim() }
                });
                if (verifyError || !verifyData?.success) {
                  console.warn('⚠️ Beehiiv verification failed, defaulting to free:', verifyError || verifyData);
                  subscriptionTier = 'free';
                } else {
                  const tierRaw = (verifyData.tier as 'free' | 'premium' | 'paid') || 'free';
                  // Treat any non-free as premium for dashboard gating
                  subscriptionTier = tierRaw === 'free' ? 'free' : 'premium';
                  console.log(`✅ Beehiiv tier: ${verifyData.tier} (mapped to ${subscriptionTier})`);
                }
              } catch (error) {
                console.warn('⚠️ Beehiiv verification error, defaulting to free:', error);
                subscriptionTier = 'free';
              }
            }
            
            // Set user with correct tier from the start
            const finalUser = {
              id: session.user.id,
              email: session.user.email,
              subscription_tier: subscriptionTier,
              user_type: userType
            };
            
            console.log('✅ Updating Supabase user with correct tier:', subscriptionTier);
            setCurrentUser(finalUser);
            setIsLoading(false);
            
          } catch (error) {
            console.error('❌ Error determining user tier:', error);
            // Fallback to basic user data
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              subscription_tier: 'free' as const,
              user_type: 'supabase_user' as const
            };
            setCurrentUser(basicUser);
            setIsLoading(false);
          }
        }, 10); // Reduced delay for faster tier determination
      } else if (event === 'SIGNED_OUT') {
        console.log('ℹ️ Supabase user signed out');
        setSupabaseUser(null);
        
        // Only clear if it was a Supabase session
        const currentAuthMethod = localStorage.getItem('auth_method');
        if (currentAuthMethod?.startsWith('supabase_')) {
          setCurrentUser(null);
          localStorage.removeItem('auth_method');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error handling auth state change:', error);
      setIsLoading(false);
    } finally {
      authStateProcessing.current = false;
    }
  }, [setCurrentUser, setSupabaseUser, setIsLoading]);

  // Initialize with clear priority hierarchy
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing enhanced auth with priority hierarchy...');
        setIsLoading(true);
        
        // PRIORITY 1: Check for Supabase session FIRST
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting Supabase session:', error);
        } else if (session?.user) {
          console.log('✅ Found Supabase user session for:', session.user.email);
          
          console.log('🔍 Determining tier for cached Supabase session...');
          setSupabaseUser(session.user);
          
          // CRITICAL FIX: Determine correct tier before setting user state
          try {
            const { data: isAdminResult } = await supabase.rpc('is_current_user_admin_fast');
            const isAdmin = !!isAdminResult;
            
            let subscriptionTier: 'free' | 'premium' = 'free';
            let userType: 'supabase_admin' | 'supabase_user' = 'supabase_user';
            
            if (isAdmin) {
              subscriptionTier = 'premium';
              userType = 'supabase_admin';
              localStorage.setItem('auth_method', 'supabase_admin');
              console.log('✅ Admin user in cached session - tier: premium');
            } else {
              localStorage.setItem('auth_method', 'supabase_user');
              
              try {
                console.log('🔍 Beehiiv verification for cached session...');
                const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
                  body: { email: session.user.email.toLowerCase().trim() }
                });
                if (!verifyError && verifyData?.success) {
                  const tierRaw = verifyData.tier as 'free' | 'premium' | 'paid';
                  subscriptionTier = tierRaw === 'free' ? 'free' : 'premium';
                  console.log(`✅ Cached Beehiiv tier: ${verifyData.tier} (mapped to ${subscriptionTier})`);
                } else {
                  console.warn('⚠️ Cached Beehiiv verification failed; using free');
                }
              } catch (apiError) {
                console.warn('⚠️ Cached Beehiiv verification error:', apiError);
              }
            }
            
            const finalUser = {
              id: session.user.id,
              email: session.user.email,
              subscription_tier: subscriptionTier,
              user_type: userType
            };
            
            console.log('✅ Setting cached session user with correct tier:', subscriptionTier);
            setCurrentUser(finalUser);
            
          } catch (error) {
            console.error('❌ Error determining tier for cached session:', error);
            // Fallback to basic user
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              subscription_tier: 'free' as const,
              user_type: 'supabase_user' as const
            };
            setCurrentUser(basicUser);
          }
          
          setIsLoading(false);
          isInitialized.current = true;
          
          return;
        }

        // PRIORITY 2: Check for cached session
        console.log('ℹ️ No Supabase admin session, checking cached auth...');
        const cachedEmail = localStorage.getItem('auth_user_email');
        if (cachedEmail) {
          console.log('✅ Found cached auth for:', cachedEmail);
          
          // Bridge the session to Supabase for proper admin access
          try {
            console.log('🌉 Bridging Whop session to Supabase for admin access...');
            const sessionToken = localStorage.getItem('enhanced_session_token');
            
            if (sessionToken) {
              const { data: bridgeData, error: bridgeError } = await supabase.functions.invoke('bridge-auth-session', {
                body: {
                  session_token: sessionToken,
                  email: cachedEmail
                }
              });
              
              if (!bridgeError && bridgeData?.access_token) {
                console.log('✅ Session bridged successfully - setting Supabase session');
                
                // Set the Supabase session with the bridged token
                const { error: sessionSetError } = await supabase.auth.setSession({
                  access_token: bridgeData.access_token,
                  refresh_token: bridgeData.refresh_token
                });
                
                if (!sessionSetError) {
                  console.log('✅ Supabase session established for Whop user');
                  // The auth state change handler will pick this up
                  return;
                } else {
                  console.error('❌ Failed to set Supabase session:', sessionSetError);
                }
              } else {
                console.error('❌ Failed to bridge session:', bridgeError);
              }
            }
          } catch (bridgeError) {
            console.error('❌ Session bridging failed:', bridgeError);
          }
          
          // Verify tier via Beehiiv for cached auth (magic link)
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
              body: { email: cachedEmail.toLowerCase().trim() }
            });
            if (!verifyError && verifyData?.success) {
              const tierRaw = (verifyData.tier as 'free' | 'paid' | 'premium') || 'free';
              const subscriptionTier = tierRaw === 'free' ? 'free' : 'premium';
              const user = {
                id: 'magic_link_user',
                email: cachedEmail,
                subscription_tier: subscriptionTier as 'free' | 'premium',
                user_type: 'unified_user' as const
              };
              localStorage.setItem('auth_method', 'magic_link');
              setCurrentUser(user);
              setIsLoading(false);
              isInitialized.current = true;
              return;
            }
          } catch (beehiivErr) {
            console.warn('⚠️ Beehiiv verification failed for cached auth; clearing cached session', beehiivErr);
            setCurrentUser(null);
          }
        } else {
          console.log('ℹ️ No valid enhanced session found, checking persistence data...');
          
          // PRIORITY 3: Fallback to persistence data (legacy support)
          const persistenceData = localStorage.getItem('auth_persistence_data');
          if (persistenceData) {
            try {
              const parsedData = JSON.parse(persistenceData);
              if (parsedData.auth_method === 'whop' && parsedData.user_email) {
                // Check if persistence data is still valid
                const now = Date.now();
                if (parsedData.expires_at && now < parsedData.expires_at) {
                  console.log('🔍 Found valid Whop persistence data, maintaining session...');
                  // Keep user logged in and show loading state for re-auth
                  // This prevents redirect to login page on refresh
                  setCurrentUser({
                    id: 'temp',
                    email: parsedData.user_email,
                    subscription_tier: 'premium' as const,
                    user_type: 'whop_user' as const
                  });
                  return; // Let the user stay logged in while we re-establish session
                } else {
                  console.log('⏰ Whop persistence data expired, clearing...');
                  localStorage.removeItem('auth_persistence_data');
                }
              }
            } catch (error) {
              console.error('Error parsing persistence data:', error);
            }
          }
          
          console.log('ℹ️ No valid session found, user not authenticated');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('❌ Enhanced auth initialization error:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initialize auth
    initializeAuth();

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
      authStateProcessing.current = false;
    };
  }, [handleAuthStateChange, setCurrentUser, setSupabaseUser, setIsLoading]);

  return { isInitialized: isInitialized.current };
};

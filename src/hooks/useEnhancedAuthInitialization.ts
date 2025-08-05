
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimplifiedAuth } from '@/utils/simplifiedAuthUtils';
import { CurrentUser } from '@/types/auth';
import { getWhopSession, hasValidWhopSession } from '@/utils/whopSessionCache';

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
        
        // Set temporary user immediately for better UX, then enhance with correct tier
        const tempUser = {
          id: session.user.id,
          email: session.user.email,
          subscription_tier: 'free' as const,
          user_type: 'supabase_user' as const
        };
        setCurrentUser(tempUser);
        setIsLoading(false);
        
        // CRITICAL FIX: Don't set user to 'free' immediately - determine correct tier first
        // Use setTimeout to avoid blocking the auth state change callback
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
              // For non-admin users, check Beehiiv sync synchronously
              localStorage.setItem('auth_method', 'supabase_user');
              
              try {
                console.log('🔍 Checking Beehiiv tier for non-admin user...');
                
                // Check beehiiv_subscribers table directly for faster and more reliable tier detection
                const { data: subscriberData, error: subscriberError } = await supabase
                  .from('beehiiv_subscribers')
                  .select('subscription_tier')
                  .eq('email', session.user.email)
                  .maybeSingle();
                
                if (subscriberError) {
                  console.warn('⚠️ Error checking beehiiv_subscribers:', subscriberError);
                  subscriptionTier = 'free';
                } else if (subscriberData && subscriberData.subscription_tier !== 'free') {
                  subscriptionTier = subscriberData.subscription_tier as 'free' | 'premium';
                  console.log(`✅ Direct Beehiiv tier found: ${subscriberData.subscription_tier}`);
                } else {
                  subscriptionTier = 'free';
                  console.log('ℹ️ No premium Beehiiv subscription found, using free tier');
                }
              } catch (error) {
                console.warn('⚠️ Beehiiv tier check failed, defaulting to free:', error);
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
            // setIsLoading is already false from temp user
            
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
            // setIsLoading is already false from temp user
          }
        }, 50); // Small delay to ensure smooth UX
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
                console.log('🔍 Checking Beehiiv tier for cached session...');
                
                // Check beehiiv_subscribers table directly for faster and more reliable tier detection
                const { data: subscriberData, error: subscriberError } = await supabase
                  .from('beehiiv_subscribers')
                  .select('subscription_tier')
                  .eq('email', session.user.email)
                  .maybeSingle();
                
                if (subscriberError) {
                  console.warn('⚠️ Error checking beehiiv_subscribers for cached session:', subscriberError);
                } else if (subscriberData && subscriberData.subscription_tier !== 'free') {
                  subscriptionTier = subscriberData.subscription_tier as 'free' | 'premium';
                  console.log(`✅ Direct cached session Beehiiv tier: ${subscriberData.subscription_tier}`);
                } else {
                  console.log('ℹ️ No premium subscription for cached session, using free');
                }
              } catch (error) {
                console.warn('⚠️ Beehiiv tier check failed for cached session:', error);
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
          
          // Check user tiers
          const isWhopAuth = await SimplifiedAuth.isWhopAuthenticated(cachedEmail);
          const isAdmin = await SimplifiedAuth.isAdmin(cachedEmail);
          const tier = await SimplifiedAuth.getUserTier(cachedEmail);
          
          const userType = isAdmin ? 'whop_admin' : (isWhopAuth ? 'whop_user' : 'supabase_user');
          localStorage.setItem('auth_method', userType);
          
          const user = {
            id: 'cached_user',
            email: cachedEmail,
            subscription_tier: tier,
            user_type: userType as 'whop_admin' | 'whop_user' | 'supabase_user'
          };
          setCurrentUser(user);
        } else {
          console.log('ℹ️ No valid enhanced session found, checking for cached Whop auth...');
          
          // PRIORITY 3: Check for cached Whop session first
          if (hasValidWhopSession()) {
            const cachedSession = getWhopSession();
            if (cachedSession) {
              console.log('💾 Found valid cached Whop session for:', cachedSession.user.email);
              console.log('🔍 Whop cached session has_whop_purchase:', cachedSession.user.has_whop_purchase);
              
              // CRITICAL FIX: Use cached purchase status to determine correct tier
              const isAdmin = false; // Whop users can't be admins for security
              const subscriptionTier = cachedSession.user.has_whop_purchase ? 'premium' : 'free';
              const userType = isAdmin ? 'whop_admin' : 'whop_user';
              
              console.log('✅ Setting Whop cached user with tier:', subscriptionTier);
              
              const whopUser: CurrentUser = {
                id: cachedSession.user.id,
                email: cachedSession.user.email,
                subscription_tier: subscriptionTier as 'free' | 'premium',
                user_type: userType as 'whop_admin' | 'whop_user'
              };
              
              setCurrentUser(whopUser);
              localStorage.setItem('auth_method', isAdmin ? 'whop_admin' : 'whop');
              return;
            }
          }
          
          // PRIORITY 4: Fallback to persistence data (legacy support)
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

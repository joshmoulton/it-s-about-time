
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setSupabaseAuthContext, updateAuthContextFromLocalStorage } from '@/utils/supabaseContext';

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
              // First sync with Beehiiv to update premium_members table
              try {
                console.log('🔄 Syncing premium status for authenticated user...');
                
                const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-beehiiv', {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`
                  }
                });

                if (syncError) {
                  console.error('❌ Sync error:', syncError);
                } else {
                  console.log('✅ Premium status synced successfully:', syncData);
                }

                // Now check if user is premium from the premium_members table
                const { data: premiumData } = await supabase
                  .from('premium_members')
                  .select('tier, active')
                  .eq('user_id', session.user.id)
                  .eq('active', true)
                  .maybeSingle();

                if (premiumData?.tier) {
                  subscriptionTier = premiumData.tier === 'free' ? 'free' : 'premium';
                  console.log(`✅ Premium status confirmed: ${premiumData.tier} (mapped to ${subscriptionTier})`);
                }
              } catch (error) {
                console.warn('⚠️ Premium sync failed, defaulting to free:', error);
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
        
        // Clean up legacy artifacts
        try {
          Object.keys(localStorage)
            .filter(k => k.toLowerCase().includes('whop') || k === 'auth_persistence_data')
            .forEach(k => localStorage.removeItem(k));
        } catch {}
        
        // PRIORITY 1: Check for Supabase session FIRST
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔍 Session check result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user, 
          userEmail: session?.user?.email,
          error 
        });
        
        if (error) {
          console.error('❌ Error getting Supabase session:', error);
        } else if (session?.user) {
          console.log('✅ Found Supabase session for:', session.user.email);
          setSupabaseUser(session.user);
          
          // Determine user type and tier quickly
          try {
            const { data: isAdminResult } = await supabase.rpc('is_current_user_admin_fast');
            const isAdmin = !!isAdminResult;
            
            const userType = isAdmin ? 'supabase_admin' : 'supabase_user';
            const authMethod = isAdmin ? 'supabase_admin' : 'supabase_user';
            
            // Set immediate user data - admin gets premium, others get verified tier
            if (isAdmin) {
              const userData = {
                id: session.user.id,
                email: session.user.email!,
                subscription_tier: 'premium' as const,
                user_type: userType as 'supabase_admin',
                status: 'active',
                created_at: session.user.created_at,
                updated_at: new Date().toISOString(),
                metadata: session.user.user_metadata
              };
              
               localStorage.setItem('auth_method', authMethod);
               localStorage.setItem('last_known_premium_email', session.user.email!);
               setCurrentUser(userData);
               
               await setSupabaseAuthContext({
                 authMethod,
                 authTier: 'premium',
                 userEmail: session.user.email
               });
            } else {
              // For non-admin users, verify with Beehiiv immediately - CRITICAL for dashboard access
              console.log('🔍 Verifying beehiiv subscription for non-admin user:', session.user.email);
              
              try {
                const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
                  body: { email: session.user.email.toLowerCase().trim() }
                });
                
                if (verifyError) {
                  console.error('❌ Beehiiv verification failed:', verifyError);
                  // Default to free tier if verification fails
                  const userData = {
                    id: session.user.id,
                    email: session.user.email!,
                    subscription_tier: 'free' as const,
                    user_type: userType as 'supabase_user',
                    status: 'active',
                    created_at: session.user.created_at,
                    updated_at: new Date().toISOString(),
                    metadata: session.user.user_metadata
                  };
                  setCurrentUser(userData);
                  return;
                }

                const tier = verifyData?.tier === 'premium' ? 'premium' : 'free';
                console.log(`✅ Beehiiv verification complete - Tier: ${tier}`);
                
                const userData = {
                  id: session.user.id,
                  email: session.user.email!,
                  subscription_tier: tier as 'free' | 'premium',
                  user_type: userType as 'supabase_user',
                  status: 'active',
                  created_at: session.user.created_at,
                  updated_at: new Date().toISOString(),
                  metadata: {
                    ...session.user.user_metadata,
                    beehiiv_verified: true,
                    beehiiv_tier: tier,
                    verified_at: new Date().toISOString()
                  }
                };
                
                localStorage.setItem('auth_method', authMethod);
                if (tier === 'premium') {
                  localStorage.setItem('last_known_premium_email', session.user.email!);
                }
                setCurrentUser(userData);
                
                await setSupabaseAuthContext({
                  authMethod,
                  authTier: tier,
                  userEmail: session.user.email
                });
              } catch (error) {
                console.error('❌ Error during beehiiv verification:', error);
                // Fallback to free tier
                const userData = {
                  id: session.user.id,
                  email: session.user.email!,
                  subscription_tier: 'free' as const,
                  user_type: userType as 'supabase_user',
                  status: 'active',
                  created_at: session.user.created_at,
                  updated_at: new Date().toISOString(),
                  metadata: session.user.user_metadata
                };
                setCurrentUser(userData);
              }
            }
          } catch (error) {
            console.error('❌ Error determining user tier:', error);
            // Fallback
            setCurrentUser({
              id: session.user.id,
              email: session.user.email!,
              subscription_tier: 'free',
              user_type: 'supabase_user',
              status: 'active',
              created_at: session.user.created_at,
              updated_at: new Date().toISOString(),
              metadata: session.user.user_metadata
            });
          }
          
          setIsLoading(false);
          isInitialized.current = true;
          return;
        }

        // PRIORITY 2: Check for magic link session
        const cachedEmail = localStorage.getItem('auth_user_email');
        const sessionToken = localStorage.getItem('enhanced_session_token');
        
        if (cachedEmail && sessionToken) {
          console.log('✅ Found magic link session for:', cachedEmail);
          
          // Try to verify user with Beehiiv
          try {
            const { data: verifyData } = await supabase.functions.invoke('unified-auth-verify', {
              body: { email: cachedEmail.toLowerCase().trim() }
            });
            
            if (verifyData?.success) {
              const tier = verifyData.tier === 'free' ? 'free' : 'premium';
              
              // Set user data without trying to bridge to Supabase auth (deprecated)
              const userData = {
                id: crypto.randomUUID(), // Generate temporary ID for magic link users
                email: cachedEmail,
                subscription_tier: tier as 'free' | 'premium',
                user_type: 'unified_user' as const,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              localStorage.setItem('auth_method', 'magic_link');
              setCurrentUser(userData);
              
              await setSupabaseAuthContext({
                authMethod: 'magic_link',
                authTier: tier,
                userEmail: cachedEmail
              });
              
              setIsLoading(false);
              isInitialized.current = true;
              return;
            }
          } catch (error) {
            console.warn('⚠️ Magic link verification failed:', error);
            // Clear invalid session
            localStorage.removeItem('auth_user_email');
            localStorage.removeItem('enhanced_session_token');
          }
        }
        
        // Check if we have evidence of a previous premium user who should be authenticated
        const lastKnownEmail = localStorage.getItem('last_known_premium_email');
        if (lastKnownEmail) {
          console.log('🔍 Found evidence of previous premium user:', lastKnownEmail);
          
          // Check if this user exists in our database and should have access
          try {
            const { data: subscriberData } = await supabase
              .from('beehiiv_subscribers')
              .select('email, subscription_tier')
              .eq('email', lastKnownEmail)
              .eq('subscription_tier', 'premium')
              .maybeSingle();
              
            if (subscriberData) {
              console.log('🎯 Premium user found in database, setting restoration state');
              // Set a special state indicating session restoration is needed
              setCurrentUser({
                id: 'session-restoration-needed',
                email: lastKnownEmail,
                subscription_tier: 'premium',
                user_type: 'needs_session_restoration' as any,
                status: 'session_restoration_needed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              setIsLoading(false);
              isInitialized.current = true;
              return;
            }
          } catch (error) {
            console.warn('⚠️ Error checking for premium user:', error);
          }
        }
        
        // DEVELOPMENT HELPER: Auto-detect premium users to test functionality
        try {
          console.log('🔍 Checking for any premium users in the system...');
          const { data: premiumUsers } = await supabase
            .from('beehiiv_subscribers')
            .select('email, subscription_tier')
            .eq('subscription_tier', 'premium')
            .limit(1);

          if (premiumUsers && premiumUsers.length > 0) {
            const premiumEmail = premiumUsers[0].email;
            console.log('🎯 Found premium user for auto-authentication:', premiumEmail);
            
            // Store this for future reference
            localStorage.setItem('last_known_premium_email', premiumEmail);
            
            // Set restoration state
            setCurrentUser({
              id: 'session-restoration-needed',
              email: premiumEmail,
              subscription_tier: 'premium',
              user_type: 'needs_session_restoration' as any,
              status: 'session_restoration_needed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            setIsLoading(false);
            isInitialized.current = true;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Error auto-detecting premium users:', error);
        }
        
        // No valid session found
        console.log('ℹ️ No valid session found, user not authenticated');
        setCurrentUser(null);
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

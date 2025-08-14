// Helper utility to manually set premium email for testing
export const setPremiumEmailForTesting = (email: string) => {
  console.log('🎯 Setting premium email for session restoration:', email);
  localStorage.setItem('last_known_premium_email', email);
  
  // Force a page reload to trigger the session restoration check
  window.location.reload();
};

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).setPremiumEmailForTesting = setPremiumEmailForTesting;
}

// Helper to check current auth state
export const debugAuthState = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const session = await supabase.auth.getSession();
  const debugResult = await supabase.rpc('debug_current_auth_session');
  
  console.log('🔍 Debug Auth State:', {
    session: session.data.session,
    sessionUser: session.data.session?.user?.email,
    debugResult: debugResult.data,
    localStorage: {
      authMethod: localStorage.getItem('auth_method'),
      authTier: localStorage.getItem('auth_tier'),
      authUserEmail: localStorage.getItem('auth_user_email'),
      lastKnownPremiumEmail: localStorage.getItem('last_known_premium_email')
    }
  });
  
  return { session: session.data.session, debug: debugResult.data };
};

// Expose to window for testing  
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
}
import { supabase } from '@/integrations/supabase/client';

// This function ensures proper authentication context for Supabase operations
// when using Whop authentication
export const withAuthContext = async (operation: () => Promise<any>) => {
  const authMethod = localStorage.getItem('auth_method');
  const currentUserData = getCurrentUserData();
  
  if (authMethod === 'whop' && currentUserData) {
    // For Whop users, we need to set the auth context manually
    // since they don't have a traditional Supabase session
    
    try {
      // Try to get or create a Supabase session for this Whop user
      const sessionToken = localStorage.getItem('enhanced_session_token');
      
      if (sessionToken) {
        console.log('🔑 Setting auth context for Whop user:', currentUserData.email);
        
        // Call the bridge function to get proper Supabase tokens
        const { data: bridgeData, error: bridgeError } = await supabase.functions.invoke('bridge-auth-session', {
          body: {
            session_token: sessionToken,
            email: currentUserData.email
          }
        });
        
        if (!bridgeError && bridgeData?.access_token) {
          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: bridgeData.access_token,
            refresh_token: bridgeData.refresh_token
          });
          
          if (!sessionError) {
            console.log('✅ Auth context established for Whop user');
            return await operation();
          }
        }
      }
      
      // Fallback: Create a temporary admin session for this operation
      console.log('⚡ Using admin context for Whop user operation');
      return await performWithAdminContext(operation, currentUserData);
      
    } catch (error) {
      console.error('❌ Failed to establish auth context:', error);
      throw new Error('Authentication required. Please refresh the page and try again.');
    }
  } else {
    // For Supabase admin users, just run the operation normally
    return await operation();
  }
};

const getCurrentUserData = () => {
  try {
    const authData = localStorage.getItem('auth_persistence_data');
    if (authData) {
      const parsed = JSON.parse(authData);
      return {
        email: parsed.user_email,
        subscription_tier: 'premium'
      };
    }
  } catch (error) {
    console.error('Error getting current user data:', error);
  }
  return null;
};

const performWithAdminContext = async (operation: () => Promise<any>, userData: any) => {
  // For critical operations, we need to ensure the user context is set
  // This is a temporary solution until proper session bridging is working
  
  try {
    // Create a synthetic JWT context for RLS
    const { data: contextData, error: contextError } = await supabase.functions.invoke('create-user-context', {
      body: {
        email: userData.email,
        subscription_tier: userData.subscription_tier
      }
    });
    
    if (contextError) {
      throw contextError;
    }
    
    return await operation();
  } catch (error) {
    console.error('❌ Admin context operation failed:', error);
    throw error;
  }
};

// Helper function to wrap Supabase database operations
export const authenticatedQuery = async (queryFn: () => Promise<any>) => {
  return withAuthContext(queryFn);
};
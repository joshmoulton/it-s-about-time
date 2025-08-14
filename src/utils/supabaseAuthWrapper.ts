import { supabase } from '@/integrations/supabase/client';

// Simplified auth context wrapper - most users now have real Supabase sessions
export const withAuthContext = async (operation: () => Promise<any>) => {
  // Check if we have a current Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    // User has real Supabase session, proceed normally
    return await operation();
  }
  
  // Fallback for legacy Whop users or edge cases
  const authMethod = localStorage.getItem('auth_method');
  const currentUserData = getCurrentUserData();
  
  if (authMethod === 'whop' && currentUserData) {
    console.log('⚡ Using admin context for legacy Whop user operation');
    return await performWithAdminContext(operation, currentUserData);
  }
  
  // No authentication context available
  throw new Error('Authentication required. Please sign in again.');
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
// Utility to set Supabase context variables for RLS policies
import { supabase } from '@/integrations/supabase/client';

interface AuthContext {
  authMethod?: string;
  authTier?: string;
  userEmail?: string;
}

export const setSupabaseAuthContext = async (context: AuthContext) => {
  try {
    // Set context variables that RLS policies can access
    const contextVars = {
      'app.auth_method': context.authMethod || '',
      'app.auth_tier': context.authTier || 'free',
      'app.user_email': context.userEmail || ''
    };

    console.log('🔧 Setting Supabase auth context:', contextVars);

    // Set each context variable
    for (const [key, value] of Object.entries(contextVars)) {
      if (value) {
        try {
          await supabase.rpc('set_config', {
            setting_name: key,
            new_value: value,
            is_local: true
          });
        } catch (error) {
          console.warn(`⚠️ Failed to set context ${key}:`, error);
        }
      }
    }

    console.log('✅ Supabase auth context set successfully');
  } catch (error) {
    console.error('❌ Failed to set Supabase auth context:', error);
  }
};

export const clearSupabaseAuthContext = async () => {
  try {
    const contextVars = [
      'app.auth_method',
      'app.auth_tier', 
      'app.user_email'
    ];

    for (const key of contextVars) {
      try {
        await supabase.rpc('set_config', {
          setting_name: key,
          new_value: '',
          is_local: true
        });
      } catch (error) {
        console.warn(`⚠️ Failed to clear context ${key}:`, error);
      }
    }

    console.log('🧹 Supabase auth context cleared');
  } catch (error) {
    console.error('❌ Failed to clear Supabase auth context:', error);
  }
};

export const updateAuthContextFromLocalStorage = async () => {
  const authMethod = localStorage.getItem('auth_method');
  const authTier = localStorage.getItem('auth_tier');
  const userEmail = localStorage.getItem('auth_user_email');

  if (authMethod || authTier || userEmail) {
    await setSupabaseAuthContext({
      authMethod,
      authTier,
      userEmail
    });
  }
};
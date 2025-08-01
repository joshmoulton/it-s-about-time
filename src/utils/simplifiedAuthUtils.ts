// Simplified authentication utilities focused on Whop integration only
// Whop authentication is isolated to the Whop button/flow

import { supabase } from '@/integrations/supabase/client';
import { ClientStorage } from '@/hooks/usePerformanceMonitor';

interface WhopUser {
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  whop_user_id: string;
}

export const SimplifiedAuth = {
  // Check if user is authenticated via Whop (only for Whop flow)
  async isWhopAuthenticated(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('whop_authenticated_users')
        .select('user_email, subscription_tier')
        .eq('user_email', email)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  // Get user's subscription tier from Whop (only for Whop flow)
  async getUserTier(email: string): Promise<'free' | 'paid' | 'premium'> {
    try {
      const { data, error } = await supabase
        .from('whop_authenticated_users')
        .select('subscription_tier')
        .eq('user_email', email)
        .single();

      return data?.subscription_tier || 'free';
    } catch {
      return 'free';
    }
  },

  // Check if user has admin access (for any user)
  async isAdmin(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('is_active, role')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  // Clear all user data on logout
  clearUserData() {
    ClientStorage.clearUserData();
    // Clear any other client-side caches without reloading the page
    console.log('🧹 SIMPLIFIED AUTH: User data cleared');
  },

  // Log authentication event (for audit purposes)
  async logAuthEvent(email: string, action: string, success: boolean) {
    try {
      await supabase.from('authentication_audit_log').insert({
        user_email: email,
        auth_method: 'whop',
        action_type: action,
        metadata: { 
          success,
          timestamp: new Date().toISOString(),
          simplified_auth: true
        }
      });
    } catch (error) {
      console.warn('Failed to log auth event:', error);
    }
  }
};

// Utility to check if a feature requires premium access
export function requiresPremiumAccess(feature: string): boolean {
  const premiumFeatures = [
    'telegram_messaging',
    'advanced_analytics',
    'premium_signals',
    'priority_support'
  ];

  return premiumFeatures.includes(feature);
}

// Utility to get user permissions based on tier
export function getUserPermissions(tier: 'free' | 'paid' | 'premium') {
  const permissions = {
    free: {
      canViewBasicSignals: true,
      canSendTelegramMessages: false,
      canAccessAnalytics: false,
      dailyMessageLimit: 0
    },
    paid: {
      canViewBasicSignals: true,
      canSendTelegramMessages: true,
      canAccessAnalytics: true,
      dailyMessageLimit: 5
    },
    premium: {
      canViewBasicSignals: true,
      canSendTelegramMessages: true,
      canAccessAnalytics: true,
      dailyMessageLimit: 50
    }
  };

  return permissions[tier];
}
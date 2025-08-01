// Unified Whop + Beehiiv Authentication Utilities
// Privacy-first, real-time verification approach

import { supabase } from '@/integrations/supabase/client';

export interface UnifiedSession {
  email: string;
  tier: 'free' | 'paid' | 'premium';
  source: 'beehiiv' | 'whop' | 'both' | 'none';
  verified_at: string;
  expires_at: string;
  session_token: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  tier: 'free' | 'paid' | 'premium';
  source: 'beehiiv' | 'whop' | 'both' | 'none';
  metadata: {
    beehiiv_active?: boolean;
    whop_active?: boolean;
    beehiiv_tier?: string;
    whop_tier?: string;
    verification_timestamp: string;
  };
  session_token?: string;
  error?: string;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_KEY = 'unified_auth_session';

export const UnifiedAuth = {
  // Verify user with unified system
  async verifyUser(email: string): Promise<VerificationResult> {
    try {
      console.log('🔍 UNIFIED AUTH: Starting verification for:', email);

      const { data, error } = await supabase.functions.invoke('unified-auth-verify', {
        body: {
          email: email.toLowerCase().trim(),
          action: 'verify'
        }
      });

      if (error) {
        console.error('🔍 UNIFIED AUTH: Verification error:', error);
        return {
          success: false,
          verified: false,
          tier: 'free',
          source: 'none',
          metadata: { verification_timestamp: new Date().toISOString() },
          error: 'Verification failed'
        };
      }

      console.log('🔍 UNIFIED AUTH: Verification result:', data);
      return data;
    } catch (error) {
      console.error('🔍 UNIFIED AUTH: Network error:', error);
      return {
        success: false,
        verified: false,
        tier: 'free',
        source: 'none',
        metadata: { verification_timestamp: new Date().toISOString() },
        error: 'Network error'
      };
    }
  },

  // Create session from verification result
  createSession(verificationResult: VerificationResult): UnifiedSession | null {
    if (!verificationResult.success || !verificationResult.verified || !verificationResult.session_token) {
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION);

    return {
      email: '', // Will be set by caller
      tier: verificationResult.tier,
      source: verificationResult.source,
      verified_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      session_token: verificationResult.session_token
    };
  },

  // Store session in localStorage
  storeSession(session: UnifiedSession, email: string): void {
    const sessionWithEmail = { ...session, email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionWithEmail));
    console.log('✅ UNIFIED AUTH: Session stored for:', email, 'Tier:', session.tier);
  },

  // Get current session from localStorage
  getCurrentSession(): UnifiedSession | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session: UnifiedSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date() > new Date(session.expires_at)) {
        console.log('🔍 UNIFIED AUTH: Session expired, clearing');
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('🔍 UNIFIED AUTH: Error reading session:', error);
      this.clearSession();
      return null;
    }
  },

  // Check if session needs refresh (older than 1 hour)
  needsRefresh(session: UnifiedSession): boolean {
    const verifiedAt = new Date(session.verified_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return verifiedAt < oneHourAgo;
  },

  // Refresh session with new verification
  async refreshSession(email: string): Promise<UnifiedSession | null> {
    console.log('🔄 UNIFIED AUTH: Refreshing session for:', email);
    
    const verificationResult = await this.verifyUser(email);
    if (!verificationResult.success || !verificationResult.verified) {
      console.log('❌ UNIFIED AUTH: Refresh failed, clearing session');
      this.clearSession();
      return null;
    }

    const newSession = this.createSession(verificationResult);
    if (newSession) {
      this.storeSession(newSession, email);
    }

    return newSession;
  },

  // Clear session
  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    console.log('🧹 UNIFIED AUTH: Session cleared');
  },

  // Perform login with unified verification
  async performLogin(email: string): Promise<{ success: boolean; session?: UnifiedSession; error?: string }> {
    try {
      console.log('🔐 UNIFIED AUTH: Starting login for:', email);

      const verificationResult = await this.verifyUser(email);
      
      if (!verificationResult.success) {
        return { success: false, error: verificationResult.error || 'Verification failed' };
      }

      if (!verificationResult.verified) {
        return { success: false, error: 'Email not found in subscriber lists' };
      }

      const session = this.createSession(verificationResult);
      if (!session) {
        return { success: false, error: 'Failed to create session' };
      }

      this.storeSession(session, email);

      console.log('✅ UNIFIED AUTH: Login successful for:', email, 'Tier:', session.tier, 'Source:', session.source);
      return { success: true, session };

    } catch (error) {
      console.error('❌ UNIFIED AUTH: Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  // Perform logout
  async performLogout(): Promise<void> {
    try {
      const session = this.getCurrentSession();
      if (session) {
        console.log('🚪 UNIFIED AUTH: Logging out user:', session.email);
        
        // Log the logout for audit purposes
        await supabase.from('authentication_audit_log').insert({
          user_email: session.email,
          auth_method: 'unified_auth',
          action_type: 'logout',
          metadata: {
            session_duration: new Date().getTime() - new Date(session.verified_at).getTime(),
            tier: session.tier,
            source: session.source
          }
        });
      }

      this.clearSession();
      
      // Clear user preferences but keep tour flags
      const tourKeys = Object.keys(localStorage).filter(key => key.startsWith('weekly-wizdom-tour-'));
      const tourData: { [key: string]: string } = {};
      tourKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) tourData[key] = value;
      });
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore tour flags
      Object.entries(tourData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('✅ UNIFIED AUTH: Logout complete');
      
      // Redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ UNIFIED AUTH: Logout error:', error);
      // Always clear session even if logging fails
      this.clearSession();
      
      // Still redirect to landing page even on error
      window.location.href = '/';
    }
  },

  // Get user permissions based on tier
  getUserPermissions(tier: 'free' | 'paid' | 'premium') {
    const permissions = {
      free: {
        canViewBasicSignals: true,
        canSendTelegramMessages: false,
        canAccessAnalytics: false,
        canAccessPremiumContent: false,
        dailyMessageLimit: 0
      },
      paid: {
        canViewBasicSignals: true,
        canSendTelegramMessages: true,
        canAccessAnalytics: true,
        canAccessPremiumContent: false,
        dailyMessageLimit: 5
      },
      premium: {
        canViewBasicSignals: true,
        canSendTelegramMessages: true,
        canAccessAnalytics: true,
        canAccessPremiumContent: true,
        dailyMessageLimit: 50
      }
    };

    return permissions[tier];
  },

  // Check if feature requires specific tier
  requiresTier(feature: string, userTier: 'free' | 'paid' | 'premium'): boolean {
    const tierRequirements: { [key: string]: 'free' | 'paid' | 'premium' } = {
      'basic_signals': 'free',
      'telegram_messaging': 'paid',
      'analytics': 'paid',
      'premium_content': 'premium',
      'priority_support': 'premium',
      'advanced_analytics': 'premium'
    };

    const requiredTier = tierRequirements[feature] || 'free';
    const tierHierarchy = { free: 0, paid: 1, premium: 2 };
    
    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }
};

export default UnifiedAuth;


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { hasValidWhopSession, getWhopSession, getWhopSessionInfo } from '@/utils/whopSessionCache';

interface WhopOAuthButtonProps {
  onSuccess: (user: any, authMethod: string) => void;
  disabled?: boolean;
}

export const WhopOAuthButton: React.FC<WhopOAuthButtonProps> = React.memo(({ onSuccess, disabled }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const { toast } = useToast();

  // Check for cached session on mount
  useEffect(() => {
    const info = getWhopSessionInfo();
    setSessionInfo(info);
    
    if (info.hasCachedSession) {
      console.log('💾 Found cached Whop session for:', info.userEmail, 'expires in:', info.hoursRemaining, 'hours');
    }
  }, []);

  const handleWhopLogin = React.useCallback(async () => {
    if (disabled) return;
    
    // Check for cached session first - optimized for instant response
    if (hasValidWhopSession()) {
      console.log('💾 Using cached Whop session...');
      setIsLoading(true);
      
      const cachedSession = getWhopSession();
      if (cachedSession) {
        // Create user object from cached data
        const user = {
          ...cachedSession.user,
          subscription_tier: cachedSession.user.has_whop_purchase ? 'premium' : 'free'
        };
        
        // Use instant response instead of showing toast that delays UX
        setTimeout(() => {
          setIsLoading(false);
          onSuccess(user, 'whop');
        }, 50); // Minimal delay for UI feedback
        return;
      }
    }
    
    console.log('🚀 Starting fresh Whop OAuth flow...');
    setIsLoading(true);
    
    try {
      // Call the Supabase function
      const { data, error } = await supabase.functions.invoke('whop-oauth-init', {
        body: { next: '/dashboard' }
      });

      if (error) {
        console.error('❌ OAuth init failed:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to initialize Whop authentication. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data?.success) {
        console.error('❌ Whop OAuth not configured:', data?.error);
        toast({
          title: "Configuration Error",
          description: data?.error || "Whop OAuth is not configured properly.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ OAuth initialization successful');
      
      // Store state for validation
      sessionStorage.setItem('whop_oauth_state', data.state);
      sessionStorage.setItem('whop_login_intent', 'login');
      
      // Direct redirect to Whop OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('❌ Whop OAuth error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to start Whop authentication. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [disabled, onSuccess, toast]);

  return (
    <Button
      type="button"
      disabled={disabled || isLoading}
      onClick={handleWhopLogin}
      className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          <span>Connecting to Whop...</span>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center">
            <div className="bg-white/20 rounded-lg p-1.5 mr-3">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">
                {sessionInfo?.hasCachedSession ? 'Continue with Whop' : 'Continue with Whop'}
              </span>
              <span className="text-xs opacity-90">
                Recommended for Premium members
              </span>
            </div>
          </div>
        </>
      )}
    </Button>
  );
});

WhopOAuthButton.displayName = 'WhopOAuthButton';

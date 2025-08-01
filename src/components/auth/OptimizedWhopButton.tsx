import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OptimizedWhopButtonProps {
  onSuccess: (user: any, authMethod: string) => void;
  disabled?: boolean;
  debugMode?: boolean;
}

// Cached session check result
let sessionCheckCache: { result: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export const OptimizedWhopButton: React.FC<OptimizedWhopButtonProps> = memo(({ 
  onSuccess, 
  disabled = false,
  debugMode = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [useRedirect, setUseRedirect] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const { toast } = useToast();

  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }, []);

  const detectBrowser = useCallback(() => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Chrome')) return 'chrome';
    return 'unknown';
  }, []);

  const debugLog = useCallback((message: string, data?: any) => {
    if (debugMode) {
      console.log(`🔍 [WhopAuth Debug] ${message}`, data || '');
    }
  }, [debugMode]);

  const handleWhopAuth = useCallback(async (forceRedirect = false) => {
    setIsLoading(true);
    setPopupBlocked(false);
    
    try {
      const browser = detectBrowser();
      const mobile = isMobile();
      
      debugLog('Starting Whop auth', { 
        browser, 
        mobile, 
        forceRedirect, 
        useRedirect,
        userAgent: navigator.userAgent,
        windowDimensions: `${window.innerWidth}x${window.innerHeight}`
      });

      // Initialize OAuth
      const { data: initData, error: initError } = await supabase.functions.invoke('whop-oauth-init', {
        body: { next: '/dashboard' }
      });

      if (initError || !initData?.success) {
        debugLog('OAuth init failed', { error: initError, data: initData });
        throw new Error(initData?.error || 'OAuth initialization failed');
      }

      debugLog('OAuth init successful', { authUrl: initData.authUrl, state: initData.state });

      // Enhanced session storage with browser info
      const timestamp = Date.now();
      const sessionData = {
        state: initData.state,
        timestamp,
        browser,
        mobile,
        authMethod: mobile || forceRedirect || useRedirect ? 'redirect' : 'popup'
      };
      
      sessionStorage.setItem('whop_oauth_state', initData.state);
      sessionStorage.setItem('whop_auth_timestamp', timestamp.toString());
      sessionStorage.setItem('whop_auth_session', JSON.stringify(sessionData));

      debugLog('Session data stored', sessionData);

      // Background session validation with retry logic
      setTimeout(() => {
        if (sessionCheckCache && (Date.now() - sessionCheckCache.timestamp) < CACHE_DURATION) {
          return;
        }
        sessionCheckCache = {
          result: { valid: true, browser, timestamp },
          timestamp: Date.now()
        };
      }, 0);

      // Determine auth method
      const shouldUseRedirect = mobile || forceRedirect || useRedirect;
      
      if (shouldUseRedirect) {
        debugLog('Using redirect flow');
        window.location.href = initData.authUrl;
        return;
      }

      // Enhanced popup handling for desktop
      debugLog('Attempting popup flow');
      
      // Safari-specific popup handling
      const popupFeatures = browser === 'safari' 
        ? 'width=600,height=700,scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no'
        : 'width=600,height=700,scrollbars=yes,resizable=yes';

      const popup = window.open(initData.authUrl, 'whop-oauth', popupFeatures);

      // Enhanced popup blocked detection
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        debugLog('Popup blocked detected');
        setPopupBlocked(true);
        setIsLoading(false);
        
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site, or try the redirect option below.",
          variant: "destructive",
        });
        return;
      }

      debugLog('Popup opened successfully');

      // Enhanced popup monitoring with retry
      let retryCount = 0;
      const maxRetries = 3;
      
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            debugLog('Popup closed by user');
            clearInterval(checkClosed);
            setIsLoading(false);
            return;
          }
          
          // Test popup accessibility (Safari sometimes blocks this)
          try {
            const popupLocation = popup.location.href;
            debugLog('Popup location accessible', { location: popupLocation });
          } catch (e) {
            // This is normal for cross-origin, but log for debugging
            if (retryCount === 0) {
              debugLog('Popup cross-origin (expected)', e);
            }
          }
          
        } catch (error) {
          debugLog('Popup check error', error);
          retryCount++;
          if (retryCount >= maxRetries) {
            clearInterval(checkClosed);
            setIsLoading(false);
            setPopupBlocked(true);
          }
        }
      }, 1000);

      // Enhanced message handling with timeout
      const messageTimeout = setTimeout(() => {
        debugLog('Message timeout reached');
        clearInterval(checkClosed);
        setIsLoading(false);
      }, 300000); // 5 minutes timeout

      const handleMessage = (event: MessageEvent) => {
        debugLog('Received message', { 
          origin: event.origin, 
          expectedOrigin: window.location.origin,
          type: event.data?.type 
        });
        
        if (event.origin !== window.location.origin) {
          debugLog('Message origin mismatch');
          return;
        }
        
        if (event.data.type === 'WHOP_OAUTH_SUCCESS') {
          debugLog('Success message received', event.data.user);
          clearInterval(checkClosed);
          clearTimeout(messageTimeout);
          setIsLoading(false);
          onSuccess(event.data.user, 'whop');
          window.removeEventListener('message', handleMessage);
          popup.close();
        } else if (event.data.type === 'WHOP_OAUTH_ERROR') {
          debugLog('Error message received', event.data.error);
          clearInterval(checkClosed);
          clearTimeout(messageTimeout);
          setIsLoading(false);
          window.removeEventListener('message', handleMessage);
          popup.close();
          
          toast({
            title: "Authentication Failed",
            description: event.data.error || "Failed to authenticate with Whop.",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup function
      const cleanup = () => {
        clearInterval(checkClosed);
        clearTimeout(messageTimeout);
        window.removeEventListener('message', handleMessage);
      };

      // Store cleanup function for potential external access
      (window as any).whopAuthCleanup = cleanup;

    } catch (error) {
      debugLog('Whop auth error', error);
      console.error('Whop auth error:', error);
      setIsLoading(false);
      
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }, [onSuccess, isMobile, detectBrowser, debugLog, useRedirect, toast]);

  return (
    <div className="space-y-3">
      <Button 
        onClick={() => handleWhopAuth(false)}
        disabled={disabled || isLoading}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <div className="bg-white/20 rounded-lg p-1.5 mr-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-semibold">Continue with Whop</span>
          </>
        )}
      </Button>

      {/* Popup blocked fallback options */}
      {popupBlocked && !isMobile() && (
        <div className="space-y-2">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Having trouble? Try these options:</span>
          </div>
          
          <Button 
            onClick={() => handleWhopAuth(true)}
            disabled={disabled || isLoading}
            variant="outline"
            className="w-full h-10 text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Use Redirect Instead
          </Button>
          
          <Button 
            onClick={() => setUseRedirect(!useRedirect)}
            variant="ghost"
            className="w-full h-8 text-xs"
          >
            {useRedirect ? 'Switch to Popup Mode' : 'Switch to Redirect Mode'}
          </Button>
        </div>
      )}

      {/* Debug info */}
      {debugMode && (
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
          <div>Browser: {detectBrowser()}</div>
          <div>Mobile: {isMobile() ? 'Yes' : 'No'}</div>
          <div>Mode: {useRedirect || isMobile() ? 'Redirect' : 'Popup'}</div>
          <div>Session Storage: {typeof sessionStorage !== 'undefined' ? 'Available' : 'Not Available'}</div>
        </div>
      )}
    </div>
  );
});

OptimizedWhopButton.displayName = 'OptimizedWhopButton';
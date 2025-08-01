
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhopConnectButtonProps {
  onConnected?: () => void;
  debugMode?: boolean;
}

export function WhopConnectButton({ onConnected, debugMode = false }: WhopConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [useRedirect, setUseRedirect] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for messages from the Whop OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'WHOP_OAUTH_SUCCESS') {
        console.log('✅ Whop OAuth completed successfully');
        setIsConnecting(false);
        toast({
          title: "Success!",
          description: "Whop account connected successfully for community access.",
        });
        onConnected?.();
      } else if (event.data.type === 'WHOP_OAUTH_ERROR') {
        console.error('❌ Whop OAuth error:', event.data.error);
        setIsConnecting(false);
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect to Whop. Please try again.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, onConnected]);

  // Enhanced device and browser detection
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  };

  const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Chrome')) return 'chrome';
    return 'unknown';
  };

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.log(`🔍 [WhopConnect Debug] ${message}`, data || '');
    }
  };

  const handleWhopConnect = async (forceRedirect = false) => {
    setIsConnecting(true);
    setPopupBlocked(false);
    
    try {
      const browser = detectBrowser();
      const mobile = isMobile();
      
      debugLog('Starting Whop connection', { 
        browser, 
        mobile, 
        forceRedirect, 
        useRedirect,
        userAgent: navigator.userAgent 
      });
      
      // Use the new OAuth initialization endpoint
      const { data: initData, error: initError } = await supabase.functions.invoke('whop-oauth-init', {
        body: { next: '/dashboard' }
      });

      if (initError) {
        debugLog('OAuth init failed', { error: initError });
        toast({
          title: "Configuration Error",
          description: "Failed to initialize Whop OAuth. Please try again.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      if (!initData?.success) {
        debugLog('Whop OAuth not configured', { error: initData?.error });
        toast({
          title: "Configuration Required",
          description: initData?.error || "Whop OAuth is not configured properly.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      debugLog('OAuth initialization successful', { authUrl: initData.authUrl });
      
      // Enhanced session storage
      const sessionData = {
        state: initData.state,
        timestamp: Date.now(),
        browser,
        mobile,
        connectIntent: true,
        authMethod: mobile || forceRedirect || useRedirect ? 'redirect' : 'popup'
      };
      
      sessionStorage.setItem('whop_oauth_state', initData.state);
      sessionStorage.setItem('whop_connect_intent', 'telegram_access');
      sessionStorage.setItem('whop_connect_session', JSON.stringify(sessionData));
      
      debugLog('Session data stored', sessionData);
      
      // Determine auth method
      const shouldUseRedirect = mobile || forceRedirect || useRedirect;
      
      if (shouldUseRedirect) {
        debugLog('Using redirect flow');
        window.location.href = initData.authUrl;
        return;
      }

      // Enhanced popup handling
      debugLog('Attempting popup flow');
      
      const popupFeatures = browser === 'safari' 
        ? 'width=600,height=700,scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no'
        : 'width=600,height=700,scrollbars=yes,resizable=yes,location=yes';

      const popup = window.open(initData.authUrl, 'whop-oauth', popupFeatures);

      // Enhanced popup blocked detection
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        debugLog('Popup blocked detected');
        setPopupBlocked(true);
        setIsConnecting(false);
        
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site, or try the redirect option below.",
          variant: "destructive",
        });
        return;
      }

      debugLog('Popup opened successfully');

      // Enhanced popup monitoring
      let retryCount = 0;
      const maxRetries = 3;
      
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            debugLog('Popup closed by user');
            clearInterval(checkClosed);
            setIsConnecting(false);
            return;
          }
        } catch (error) {
          debugLog('Popup check error', error);
          retryCount++;
          if (retryCount >= maxRetries) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            setPopupBlocked(true);
          }
        }
      }, 1000);

    } catch (error) {
      debugLog('Whop connect error', error);
      console.error('❌ Whop connect error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Whop. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={() => handleWhopConnect(false)}
        disabled={isConnecting}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            <span>Connecting to Whop...</span>
          </>
        ) : (
          <>
            <div className="bg-white/20 rounded-lg p-1.5 mr-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-semibold">Connect Whop Account</span>
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
            onClick={() => handleWhopConnect(true)}
            disabled={isConnecting}
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
          <div>Connect Intent: Active</div>
        </div>
      )}
    </div>
  );
}

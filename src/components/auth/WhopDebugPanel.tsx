import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Monitor, Smartphone, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DebugInfo {
  browser: string;
  userAgent: string;
  isMobile: boolean;
  sessionStorageAvailable: boolean;
  popupSupported: boolean;
  origin: string;
  storedSessionData: any;
  timestamp: string;
}

export const WhopDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const collectDebugInfo = () => {
    const userAgent = navigator.userAgent;
    const browser = userAgent.includes('Safari') && !userAgent.includes('Chrome') ? 'safari' : 
                   userAgent.includes('Firefox') ? 'firefox' : 
                   userAgent.includes('Chrome') ? 'chrome' : 'unknown';
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                     window.innerWidth <= 768;

    let storedSessionData = null;
    try {
      const whopSession = sessionStorage.getItem('whop_auth_session');
      const whopState = sessionStorage.getItem('whop_oauth_state');
      const whopTimestamp = sessionStorage.getItem('whop_auth_timestamp');
      
      storedSessionData = {
        session: whopSession ? JSON.parse(whopSession) : null,
        state: whopState,
        timestamp: whopTimestamp
      };
    } catch (e) {
      storedSessionData = { error: 'Failed to parse stored data' };
    }

    // Test popup support
    let popupSupported = true;
    try {
      const testPopup = window.open('', '_blank', 'width=1,height=1');
      if (testPopup) {
        testPopup.close();
      } else {
        popupSupported = false;
      }
    } catch (e) {
      popupSupported = false;
    }

    const info: DebugInfo = {
      browser,
      userAgent,
      isMobile,
      sessionStorageAvailable: typeof sessionStorage !== 'undefined',
      popupSupported,
      origin: window.location.origin,
      storedSessionData,
      timestamp: new Date().toISOString()
    };

    setDebugInfo(info);
  };

  const clearStoredData = () => {
    try {
      sessionStorage.removeItem('whop_auth_session');
      sessionStorage.removeItem('whop_oauth_state');
      sessionStorage.removeItem('whop_auth_timestamp');
      sessionStorage.removeItem('whop_login_intent');
      sessionStorage.removeItem('whop_connect_intent');
      collectDebugInfo(); // Refresh the info
    } catch (e) {
      console.error('Failed to clear stored data:', e);
    }
  };

  useEffect(() => {
    if (isVisible) {
      collectDebugInfo();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <Button 
        onClick={() => setIsVisible(true)}
        variant="outline" 
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Whop Auth
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Whop Auth Debug</CardTitle>
          <Button 
            onClick={() => setIsVisible(false)}
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 text-xs">
        {debugInfo && (
          <>
            {/* Environment Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {debugInfo.isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                <span className="font-medium">Environment</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Browser:</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    {debugInfo.browser}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Device:</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    {debugInfo.isMobile ? 'Mobile' : 'Desktop'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Capabilities */}
            <div className="space-y-2">
              <span className="font-medium">Capabilities</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {debugInfo.sessionStorageAvailable ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                    <XCircle className="h-3 w-3 text-red-500" />
                  }
                  <span>Session Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.popupSupported ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                    <XCircle className="h-3 w-3 text-red-500" />
                  }
                  <span>Popup Support</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stored Data */}
            <div className="space-y-2">
              <span className="font-medium">Stored Data</span>
              {debugInfo.storedSessionData?.session ? (
                <div className="text-xs bg-muted p-2 rounded">
                  <div>Auth Method: {debugInfo.storedSessionData.session.authMethod}</div>
                  <div>Browser: {debugInfo.storedSessionData.session.browser}</div>
                  <div>Mobile: {debugInfo.storedSessionData.session.mobile ? 'Yes' : 'No'}</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span>No stored session</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Recommendations */}
            <div className="space-y-2">
              <span className="font-medium">Recommendations</span>
              <div className="space-y-1 text-xs">
                {debugInfo.browser === 'safari' && !debugInfo.isMobile && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Safari on Mac: Use redirect mode for best compatibility</span>
                  </div>
                )}
                {!debugInfo.popupSupported && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-3 w-3" />
                    <span>Popups blocked: Enable popups or use redirect mode</span>
                  </div>
                )}
                {debugInfo.isMobile && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Mobile detected: Redirect mode will be used automatically</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={collectDebugInfo}
                variant="outline" 
                size="sm"
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button 
                onClick={clearStoredData}
                variant="outline" 
                size="sm"
                className="h-7 text-xs"
              >
                Clear Data
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
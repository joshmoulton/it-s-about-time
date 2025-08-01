
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storeWhopSession } from '@/utils/whopSessionCache';

export const useWhopCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useEnhancedAuth();
  const { toast } = useToast();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Enhanced debugging for Mac issues
        const userAgent = navigator.userAgent;
        const browser = userAgent.includes('Safari') && !userAgent.includes('Chrome') ? 'safari' : 
                       userAgent.includes('Firefox') ? 'firefox' : 
                       userAgent.includes('Chrome') ? 'chrome' : 'unknown';
        
        console.log('🔄 Starting Whop OAuth callback processing...');
        console.log('🖥️ Browser detection:', { browser, userAgent });
        console.log('Current URL:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        console.log('📱 Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
        console.log('🔍 Session storage availability:', typeof sessionStorage !== 'undefined');
        
        // Check for stored session data
        const initialStoredSession = sessionStorage.getItem('whop_auth_session');
        if (initialStoredSession) {
          try {
            const sessionData = JSON.parse(initialStoredSession);
            console.log('📦 Found stored session data:', sessionData);
          } catch (e) {
            console.warn('⚠️ Failed to parse stored session data:', e);
          }
        }
        
        setStatus('Processing Whop OAuth callback...');
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error_param = searchParams.get('error');
        const error_description = searchParams.get('error_description');
        
        console.log('OAuth params:', { 
          code: code?.substring(0, 10) + '...', 
          state, 
          error_param, 
          error_description 
        });
        
        // Check if this is running in a popup window
        const isPopup = window.opener && window.opener !== window;
        console.log('🔍 Running in popup mode:', isPopup);
        
        // Check for OAuth errors first
        if (error_param) {
          console.error('❌ OAuth error from Whop:', error_param, error_description);
          const errorMessage = `Authentication failed: ${error_description || error_param}`;
          setError(errorMessage);
          setIsProcessing(false);
          
          // Send error to parent window if in popup
          if (isPopup) {
            console.log('📤 Sending error to parent window');
            window.opener.postMessage({
              type: 'WHOP_OAUTH_ERROR',
              error: errorMessage
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          } else {
            // Redirect to error page like the SDK example
            navigate(`/login?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`);
          }
          return;
        }
        
        if (!code) {
          console.error('❌ No authorization code received');
          const errorMessage = 'No authorization code received from Whop.';
          setError(errorMessage);
          setIsProcessing(false);
          
          // Send error to parent window if in popup
          if (isPopup) {
            console.log('📤 Sending no-code error to parent window');
            window.opener.postMessage({
              type: 'WHOP_OAUTH_ERROR',
              error: errorMessage
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          } else {
            navigate(`/login?error=missing_code`);
          }
          return;
        }

        // Enhanced state validation with Mac-specific handling
        const storedState = sessionStorage.getItem('whop_oauth_state');
        const storedSession = sessionStorage.getItem('whop_auth_session');
        
        console.log('🔐 Enhanced state validation:', { 
          received: state, 
          stored: storedState,
          hasStoredSession: !!storedSession,
          browser
        });
        
        // Parse stored session for additional context
        let sessionData = null;
        if (storedSession) {
          try {
            sessionData = JSON.parse(storedSession);
            console.log('📦 Session context:', {
              authMethod: sessionData.authMethod,
              browser: sessionData.browser,
              timestamp: new Date(sessionData.timestamp).toISOString()
            });
          } catch (e) {
            console.warn('⚠️ Failed to parse session data:', e);
          }
        }
        
        // If no state in URL but we have stored state, use stored state for consistency
        const finalState = state || storedState;
        
        // Enhanced state validation with Mac Safari considerations
        if (storedState && state && state !== storedState) {
          console.error('❌ OAuth state mismatch:', { 
            received: state, 
            stored: storedState,
            browser,
            sessionData
          });
          
          // For Safari on Mac, sometimes state can be inconsistent due to popup handling
          if (browser === 'safari' && sessionData?.authMethod === 'popup') {
            console.warn('⚠️ Safari popup state mismatch - proceeding with stored state for compatibility');
            // Use stored state for Safari popup compatibility
          } else {
            const errorMessage = 'Invalid OAuth state. Please try again.';
            setError(errorMessage);
            setIsProcessing(false);
            
            if (isPopup) {
              window.opener.postMessage({
                type: 'WHOP_OAUTH_ERROR',
                error: errorMessage
              }, window.location.origin);
              setTimeout(() => window.close(), 1000);
            } else {
              navigate(`/login?error=invalid_state`);
            }
            return;
          }
        }
        
        // Clean up stored state and session data
        if (storedState) {
          sessionStorage.removeItem('whop_oauth_state');
        }
        if (storedSession) {
          sessionStorage.removeItem('whop_auth_session');
        }

        setStatus('Exchanging authorization code...');
        console.log('🔄 Exchanging Whop authorization code for access token...');

        // Use the exact same redirect URI format that was used in the initial request
        const redirectUri = `${window.location.origin}/auth/whop/callback`;
        
        console.log('📍 WHOP DEBUG: Using redirect URI:', redirectUri);
        console.log('🔍 WHOP DEBUG: Window location details:', {
          origin: window.location.origin,
          href: window.location.href,
          pathname: window.location.pathname,
          host: window.location.host,
          protocol: window.location.protocol
        });

        // Exchange code for access token with improved error handling
        console.log('📞 Calling whop-oauth-exchange function...');
        console.log('📤 Request payload:', { 
          hasCode: !!code, 
          redirectUri: redirectUri,
          hasState: !!state 
        });
        // Log the request details before sending
        const requestBody = { 
          code,
          state: finalState  // Use finalState instead of state
        };
        console.log('📤 WHOP DEBUG: Final request body being sent:', {
          hasCode: !!code,
          codeLength: code?.length,
          finalState: finalState,
          hasFinalState: !!finalState,
          requestBody: requestBody
        });
        console.log('📤 WHOP DEBUG: About to send exchange request with:', {
          hasCode: !!code,
          codeLength: code?.length,
          redirectUri: redirectUri,
          hasState: !!state,
          requestBody: requestBody
        });
        
        const { data, error: exchangeError } = await supabase.functions.invoke('whop-oauth-exchange', {
          body: requestBody
        });

        console.log('📞 Function response details:', { 
          hasData: !!data, 
          dataKeys: data ? Object.keys(data) : [], 
          hasError: !!exchangeError,
          errorType: exchangeError?.constructor?.name,
          errorMessage: exchangeError?.message,
          fullResponse: { data, error: exchangeError }
        });

        if (exchangeError) {
          console.error('❌ Supabase function error details:', {
            error: exchangeError,
            message: exchangeError.message,
            details: exchangeError.details,
            status: exchangeError.status,
            code: exchangeError.code,
            stringified: JSON.stringify(exchangeError, null, 2)
          });
          const errorMessage = `Authentication service error: ${exchangeError.message || exchangeError.details || 'Please try again.'}`;
          setError(errorMessage);
          setIsProcessing(false);
          
          if (isPopup) {
            window.opener.postMessage({
              type: 'WHOP_OAUTH_ERROR',
              error: errorMessage
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          } else {
            navigate(`/login?error=service_error`);
          }
          return;
        }

        if (!data?.success) {
          console.error('❌ OAuth exchange failed:', data?.error, data?.details);
          const errorMessage = data?.error || 'Failed to authenticate with Whop.';
          setError(errorMessage);
          setIsProcessing(false);
          
          if (isPopup) {
            window.opener.postMessage({
              type: 'WHOP_OAUTH_ERROR',
              error: errorMessage,
              details: data?.details
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          } else {
            navigate(`/login?error=exchange_failed&details=${encodeURIComponent(data?.details || '')}`);
          }
          return;
        }

        setStatus('Completing authentication...');
        console.log('✅ Whop OAuth successful for app-only access, user:', data.user?.email);
        console.log('🏪 User has Whop purchase:', data.user?.has_whop_purchase);

        // Check what type of flow this was
        const loginIntent = sessionStorage.getItem('whop_login_intent');
        const connectIntent = sessionStorage.getItem('whop_connect_intent');
        
        console.log('🔍 Flow detection:', { loginIntent, connectIntent, isPopup });
        
        if (isPopup) {
          console.log('📤 Popup mode - sending success message to parent');
          console.log('🖥️ Browser context for popup:', { browser, userAgent: navigator.userAgent });
          
          // Enhanced popup messaging with Mac Safari compatibility
          const messageData = {
            type: 'WHOP_OAUTH_SUCCESS',
            user: data.user,
            access_token: data.access_token,
            browser,
            timestamp: Date.now()
          };
          
          console.log('📤 Sending message to parent:', messageData);
          
          // For popup (both login and connect), send success message to parent
          try {
            // Determine the correct parent origin - prioritize www version for consistency
            const parentOrigin = window.location.hostname.includes('weeklywizdom.com') 
              ? 'https://www.weeklywizdom.com' 
              : window.location.origin;
            
            console.log('🎯 Target origin for postMessage:', parentOrigin);
            window.opener.postMessage(messageData, parentOrigin);
            
            // Enhanced verification for Mac Safari
            if (browser === 'safari') {
              console.log('🍎 Safari detected - adding additional message verification');
              setTimeout(() => {
                try {
                  window.opener.postMessage(messageData, parentOrigin);
                } catch (e) {
                  console.warn('⚠️ Secondary Safari message failed:', e);
                }
              }, 100);
            }
            
          } catch (e) {
            console.error('❌ Failed to send message to parent:', e);
            // Fallback: try to close and let parent detect closure
            setTimeout(() => window.close(), 1000);
            return;
          }
          
          // Clean up session storage
          if (loginIntent) sessionStorage.removeItem('whop_login_intent');
          if (connectIntent) sessionStorage.removeItem('whop_connect_intent');
          
          // Enhanced popup closure with Safari considerations
          if (browser === 'safari') {
            // Safari sometimes needs more time to process the message
            setTimeout(() => window.close(), 1000);
          } else {
            setTimeout(() => window.close(), 500);
          }
        } else {
          console.log('🏠 Direct navigation mode - completing Whop auth flow');
          // For Whop users, we don't use the Beehiiv enhanced auth system
          // We set them as authenticated directly since Whop OAuth already verified them
          console.log('✅ Whop OAuth completed successfully');
          
          // Store the session in cache for future use
          storeWhopSession(data.user, data.access_token);
          
          // Create a Whop user object compatible with our auth system
          console.log('🎯 Creating Whop user with tier mapping:', {
            userEmail: data.user.email,
            hasWhopPurchase: data.user.has_whop_purchase,
            determinedTier: data.user.has_whop_purchase ? 'premium' : 'free',
            userSubscriptionTier: data.user.subscription_tier
          });
          
          // Ensure the user object has the correct structure for enhanced auth
          const enhancedUser = {
            id: data.user.id,
            email: data.user.email,
            subscription_tier: data.user.subscription_tier || (data.user.has_whop_purchase ? 'premium' : 'free'),
            has_whop_purchase: data.user.has_whop_purchase,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              username: data.user.username,
              whop_user_id: data.user.id,
              access_token: data.access_token
            }
          };
          
          console.log('🎯 Enhanced user object:', enhancedUser);
          console.log('✅ About to call setAuthenticatedUser with Whop method');
          
          setAuthenticatedUser(enhancedUser, 'whop');
          
          const tierMessage = data.user.has_whop_purchase ? 
            'with community access' : 
            'as free user (purchase required for community access)';
          
          // Clear any error state and show success
          setError('');
          setStatus('Authentication successful! Redirecting...');
          
          toast({
            title: "Welcome!",
            description: `Successfully authenticated with Whop ${tierMessage}`,
          });
          
          // Set a brief delay for state updates, then navigate
          setTimeout(() => {
            console.log('🚀 Navigating to dashboard...');
            setIsProcessing(false);
            navigate('/dashboard', { replace: true });
          }, 500);
        }
      } catch (error) {
        console.error('❌ Whop callback error:', error);
        const errorMessage = 'An unexpected error occurred during authentication.';
        setError(errorMessage);
        setIsProcessing(false);
        
        // Send error to parent window if in popup
        const isPopup = window.opener && window.opener !== window;
        if (isPopup) {
          window.opener.postMessage({
            type: 'WHOP_OAUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          setTimeout(() => window.close(), 1000);
        } else {
          navigate(`/login?error=unexpected_error`);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthenticatedUser, toast]);

  return {
    isProcessing,
    error,
    status
  };
};

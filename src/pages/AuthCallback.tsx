import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing authentication callback...');
        
        // Check for session data from magic link verification
        const sessionDataParam = searchParams.get('session_data');
        const tierParam = searchParams.get('tier');
        const verifiedParam = searchParams.get('verified');
        
        if (sessionDataParam && verifiedParam === 'true') {
          console.log('🔄 Processing magic link session data...');
          try {
            const sessionData = JSON.parse(atob(sessionDataParam));
            console.log('✅ Magic link session processed for:', sessionData.user.email);
            
            // Set the session in Supabase client
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token
            });
            
            if (setSessionError) {
              console.error('❌ Error setting session:', setSessionError);
              setStatus('error');
              setMessage('Failed to establish session. Please try again.');
              return;
            }
            
            console.log('✅ Session established successfully');
            setMessage(`Welcome! Your subscription tier: ${tierParam}`);
            setStatus('success');
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
            return;
          } catch (decodeError) {
            console.error('❌ Error decoding session data:', decodeError);
            setStatus('error');
            setMessage('Invalid session data. Please try again.');
            return;
          }
        }
        
        // Check for fallback session data from old magic link format
        const sessionParam = searchParams.get('session');
        
        if (sessionParam && verifiedParam === 'true') {
          console.log('🔄 Processing fallback unified auth session...');
          try {
            const sessionData = JSON.parse(atob(sessionParam));
            console.log('✅ Fallback session processed for:', sessionData.email);
            setMessage(`Welcome! Your subscription tier: ${sessionData.tier}`);
            setStatus('success');
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
            return;
          } catch (decodeError) {
            console.error('❌ Error decoding session data:', decodeError);
          }
        }
        
        // Handle standard Supabase magic link callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          return;
        }

        if (!session) {
          console.log('❌ No Supabase session found');
          setStatus('error');
          setMessage('No active session found. Please try logging in again.');
          return;
        }

        console.log('✅ Supabase session found for user:', session.user.email);
        setMessage('Verifying your subscription tier...');

        // Verify tier with Beehiiv and update user metadata
        if (session.user.email) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
              body: { email: session.user.email }
            });
            
            if (verifyData?.success) {
              console.log(`✅ User tier verified: ${verifyData.tier}`);
              
              // Update user metadata with tier info
              await supabase.auth.updateUser({
                data: {
                  subscription_tier: verifyData.tier,
                  source: 'beehiiv',
                  verified_at: new Date().toISOString()
                }
              });
              
              setMessage(`Welcome! Your subscription tier: ${verifyData.tier}`);
            } else {
              console.warn('⚠️ Could not verify tier:', verifyError);
              setMessage('Welcome! Subscription tier verification pending...');
            }
          } catch (verifyError) {
            console.warn('⚠️ Could not verify tier:', verifyError);
            setMessage('Welcome! Subscription tier verification pending...');
          }
        }

        setStatus('success');
        
        // Small delay for user feedback
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg border p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          {status === 'processing' && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <h1 className="text-xl font-semibold mb-2">
          {status === 'processing' && 'Authenticating...'}
          {status === 'success' && 'Welcome!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>
        
        <p className="text-muted-foreground mb-4">{message}</p>
        
        {status === 'error' && (
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
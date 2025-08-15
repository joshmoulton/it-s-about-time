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
        
        const u = new URL(window.location.href);
        const code = u.searchParams.get('code');
        const token_hash = u.searchParams.get('token_hash');
        const type = u.searchParams.get('type');

        // Handle PKCE flow (code exchange)
        if (code) {
          console.log('🔄 Processing PKCE code exchange...');
          setMessage('Verifying your login...');
          
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('❌ Code exchange failed:', error);
            setStatus('error');
            setMessage(error.message || 'Authentication failed');
            return;
          }
        }

        // Handle magic link verification (token_hash)
        if (token_hash && type === 'email') {
          console.log('🔄 Processing magic link token verification...');
          setMessage('Verifying your login...');
          
          const { error } = await supabase.auth.verifyOtp({ 
            type: 'email', 
            token_hash 
          });
          if (error) {
            console.error('❌ Magic link verification failed:', error);
            setStatus('error');
            setMessage(error.message || 'Magic link verification failed');
            return;
          }
        }

        // Get the session after verification
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('❌ No session after verification');
          setStatus('error');
          setMessage('No session found after verification');
          return;
        }

        console.log('✅ Authentication successful for:', session.user.email);
        setMessage('Verifying subscription access...');

        // CRITICAL: Verify beehiiv subscription before dashboard access
        if (!session.user.email) {
          setStatus('error');
          setMessage('No email found in session');
          return;
        }

        try {
          console.log('🔍 Verifying beehiiv subscription for:', session.user.email);
          
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
            body: { email: session.user.email }
          });
          
          if (verifyError) {
            console.error('❌ Beehiiv verification failed:', verifyError);
            setStatus('error');
            setMessage('Failed to verify subscription access. Please try again.');
            return;
          }

          if (!verifyData || !verifyData.tier) {
            console.error('❌ No tier data received from beehiiv');
            setStatus('error');
            setMessage('Unable to verify subscription tier. Please contact support.');
            return;
          }

          const tier = verifyData.tier;
          console.log(`✅ Beehiiv verification successful - Tier: ${tier}`);
          
          // Update user metadata with verified tier
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              subscription_tier: tier,
              beehiiv_verified: true,
              verified_at: new Date().toISOString(),
              beehiiv_status: verifyData.status || 'active'
            }
          });

          if (updateError) {
            console.warn('⚠️ Failed to update user metadata:', updateError);
          }

          console.log('✅ User metadata updated with verified tier:', tier);
          setMessage(`Welcome! Access verified - Tier: ${tier}`);
          setStatus('success');
          
          // Navigate to dashboard after successful verification
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);

        } catch (verifyError) {
          console.error('❌ Beehiiv verification error:', verifyError);
          setStatus('error');
          setMessage('Failed to verify subscription access. Please try again.');
        }

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
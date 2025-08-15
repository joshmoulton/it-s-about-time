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
        
        // Handle Supabase native magic link flow
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const code = searchParams.get('code');

        if (tokenHash && type === 'email') {
          console.log('🔄 Processing Supabase magic link verification...');
          
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              type: 'email',
              token_hash: tokenHash
            });

            if (error) {
              console.error('❌ Magic link verification failed:', error);
              setStatus('error');
              setMessage(error.message || 'Magic link verification failed');
              return;
            }

            if (data.user) {
              console.log('✅ Magic link verified successfully:', data);
              
              // Get tier from user metadata or verify with Beehiiv
              let tier = data.user.user_metadata?.subscription_tier || 'free';
              
              if (data.user.email) {
                try {
                  const { data: verifyData } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
                    body: { email: data.user.email }
                  });
                  
                  if (verifyData?.success) {
                    tier = verifyData.tier;
                    console.log(`✅ User tier verified: ${tier}`);
                    
                    // Update user metadata with tier info
                    await supabase.auth.updateUser({
                      data: {
                        subscription_tier: tier,
                        source: 'magic_link',
                        verified_at: new Date().toISOString()
                      }
                    });
                  }
                } catch (verifyError) {
                  console.warn('⚠️ Could not verify tier:', verifyError);
                }
              }
              
              setMessage(`Welcome! Your subscription tier: ${tier}`);
              setStatus('success');
              
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 1500);

              return;
            }
          } catch (error) {
            console.error('❌ Magic link verification error:', error);
            setStatus('error');
            setMessage('Magic link verification failed');
            return;
          }
        }

        // Handle PKCE flow
        if (code) {
          console.log('🔄 Processing PKCE code exchange...');
          
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error('❌ Code exchange failed:', error);
              setStatus('error');
              setMessage(error.message || 'Authentication failed');
              return;
            }

            if (data.user) {
              console.log('✅ PKCE authentication successful:', data);
              
              setMessage('Welcome! Authentication successful.');
              setStatus('success');
              
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 1500);

              return;
            }
          } catch (error) {
            console.error('❌ PKCE authentication error:', error);
            setStatus('error');
            setMessage('Authentication failed');
            return;
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
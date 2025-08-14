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
        console.log('🔄 Processing auth callback...');
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          return;
        }

        if (!session) {
          console.log('❌ No session found');
          setStatus('error');
          setMessage('No active session found. Please try logging in again.');
          return;
        }

        console.log('✅ Session found for user:', session.user.email);
        setMessage('Syncing your subscription status...');

        // Sync with Beehiiv to update premium status
        try {
          console.log('🔄 Calling sync-beehiiv function...');
          const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-beehiiv', {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (syncError) {
            console.error('❌ Sync error:', syncError);
            // Don't fail auth for sync errors, just log them
          } else {
            console.log('✅ Premium status synced successfully:', syncData);
          }
        } catch (syncError) {
          console.error('❌ Sync function error:', syncError);
          // Don't fail auth for sync errors
        }

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
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
  }, [navigate]);

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
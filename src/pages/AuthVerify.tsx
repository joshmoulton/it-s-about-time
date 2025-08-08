
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

const AuthVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuthenticatedUser } = useEnhancedAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your access link...');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid or missing verification parameters.');
        return;
      }

      try {
        // Validate token format
        if (!token || token.length < 32) {
          setStatus('error');
          setMessage('Invalid access link format. Please request a new one.');
          return;
        }

        // Use unified auth verification to get proper user tier and data
        console.log(`🔍 Verifying user with unified auth: ${email}`);
        
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
          body: { email: decodeURIComponent(email) }
        });

        if (verifyError) {
          console.error('❌ Unified auth verification error:', verifyError);
          setStatus('error');
          setMessage('Failed to verify your account. Please request a new access link.');
          return;
        }

        if (!verifyData?.success) {
          console.log('⚠️ User not verified through Beehiiv');
          setStatus('error');
          setMessage('Unable to verify your account. Please request a new access link.');
          return;
        }

        console.log('✅ Unified auth verification successful:', {
          tier: verifyData.tier,
          source: verifyData.source,
          verified: verifyData.verified
        });

        // Success! Store authentication data with proper tier information
        localStorage.setItem('auth_user_email', decodeURIComponent(email));
        localStorage.setItem('auth_method', 'magic_link');
        localStorage.setItem('auth_verified_at', new Date().toISOString());
        const normalizedTier = verifyData.tier === 'free' ? 'free' : 'premium';
        localStorage.setItem('auth_user_tier', normalizedTier);
        localStorage.setItem('auth_user_source', verifyData.source || 'beehiiv');

        // Immediately set auth context to avoid redirect loop
        setAuthenticatedUser({
          id: 'magic_link_user',
          email: decodeURIComponent(email),
          subscription_tier: normalizedTier,
          user_type: 'unified_user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: { source: verifyData.source || 'beehiiv' }
        }, 'magic_link');

        setStatus('success');
        setMessage('Successfully verified! Redirecting to dashboard...');

        // Show success toast
        toast({
          title: "Welcome!",
          description: "You've been successfully signed in.",
        });

        // Redirect immediately
        navigate('/dashboard');

      } catch (error) {
        console.error('❌ Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams, navigate, toast]);

  const handleRequestNewLink = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border-2 border-border rounded-lg p-6 text-center space-y-6">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Verifying Access</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Access Verified!</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={handleRequestNewLink}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Request New Access Link
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthVerify;

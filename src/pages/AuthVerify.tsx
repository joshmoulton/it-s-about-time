
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setSupabaseAuthContext } from '@/utils/supabaseContext';
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

      console.log('🔍 URL Parameters:', { 
        token: token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : 'missing',
        email: email ? decodeURIComponent(email) : 'missing',
        fullUrl: window.location.href
      });

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

        console.log(`🔍 Validating magic link token for: ${email}`);
        console.log('🔍 Token:', token);
        console.log('🔍 Email:', decodeURIComponent(email));
        
        console.log('🔍 About to call verify-magic-link function with:', { token, email: decodeURIComponent(email) });
        
        // Call the verify-magic-link function (the correct working one)
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-magic-link', {
          body: { 
            token: token,
            email: decodeURIComponent(email) 
          }
        });
        
        console.log('🔍 Function call complete');
        console.log('🔍 Response data:', verifyData);
        console.log('🔍 Response error:', verifyError);
        
        if (verifyError) {
          console.log('🔍 Error details:', {
            message: verifyError.message,
            code: verifyError.code,
            details: verifyError.details,
            hint: verifyError.hint
          });
        }

        console.log('🔍 Verification response:', { verifyData, verifyError });

        if (verifyError) {
          console.error('❌ Magic link verification error:', verifyError);
          setStatus('error');
          setMessage('Failed to verify your access link. Please request a new one.');
          return;
        }

        if (!verifyData?.success) {
          console.log('⚠️ Invalid magic link token');
          console.log('🔍 Response details:', verifyData);
          setStatus('error');
          setMessage(verifyData?.error || 'This magic link has expired or been used. Please request a new one from the homepage.');
          return;
        }

        console.log('✅ Magic link verification successful:', {
          user_id: verifyData.user.id,
          tier: verifyData.user.subscription_tier,
          source: verifyData.user.source
        });

        // Set the Supabase session using the tokens from verification
        if (verifyData.session?.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: verifyData.session.access_token,
            refresh_token: verifyData.session.refresh_token
          });

          if (sessionError) {
            console.error('❌ Error setting Supabase session:', sessionError);
            // Continue without Supabase session - fallback to enhanced auth
          } else {
            console.log('✅ Supabase session established successfully');
          }
        }

        // Store authentication data with exact tier from verification
        localStorage.setItem('auth_user_email', decodeURIComponent(email));
        localStorage.setItem('auth_method', 'magic_link');
        localStorage.setItem('auth_verified_at', new Date().toISOString());
        localStorage.setItem('auth_tier', verifyData.user.subscription_tier);
        localStorage.setItem('auth_user_source', verifyData.user.source || 'beehiiv');
        
        // Store premium email for session restoration if needed
        if (verifyData.user.subscription_tier === 'premium') {
          localStorage.setItem('last_known_premium_email', decodeURIComponent(email));
        }

        // Flag recent login to provide a short grace period for route guards
        sessionStorage.setItem('ww.justLoggedIn', String(Date.now()));

        // Set auth context with verified user data
        setAuthenticatedUser({
          id: verifyData.user.id || 'magic_link_user',
          email: decodeURIComponent(email),
          subscription_tier: verifyData.user.subscription_tier,
          user_type: 'unified_user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: { source: verifyData.user.source || 'beehiiv' }
        }, 'magic_link');

        // Set Supabase context for RLS policies
        await setSupabaseAuthContext({
          authMethod: 'magic_link',
          authTier: verifyData.user.subscription_tier,
          userEmail: decodeURIComponent(email)
        });

        setStatus('success');
        setMessage('Successfully verified! Redirecting to dashboard...');

        // Success - no toast to avoid annoying notifications

        // Redirect to dashboard with tier-specific access
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);

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

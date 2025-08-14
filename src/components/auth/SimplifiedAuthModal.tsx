import React, { useState, useCallback, memo, Suspense, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AuthModalSkeleton } from './AuthModalSkeleton';
import { WelcomeView } from './components/WelcomeView';
import { MagicLinkView, SignInView, SignUpView } from './components/AuthFormViews';
import { authRequestDeduplication } from '@/utils/authRequestDeduplication';

interface SimplifiedAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExplicitClose?: () => void;
}

type AuthMode = 'welcome' | 'signin' | 'signup' | 'magic';

export const SimplifiedAuthModal: React.FC<SimplifiedAuthModalProps> = memo(({ open, onOpenChange, onExplicitClose }) => {
  const { setAuthenticatedUser, isAuthenticated } = useEnhancedAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>('');
  
  // Refs to prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);
  const magicLinkRequestIdRef = useRef<string | null>(null);

  // Auto-close and redirect when auth completes (e.g., after magic link)
  useEffect(() => {
    if (isAuthenticated && open) {
      // Close modal immediately and prevent reopening
      onOpenChange(false);
      // Mark that auth is complete to prevent modal from reopening
      sessionStorage.setItem('ww.auth_complete', Date.now().toString());
      navigate('/dashboard');
    }
  }, [isAuthenticated, open, onOpenChange, navigate]);

  // Prevent modal from opening if auth was just completed
  useEffect(() => {
    const authCompleteTime = sessionStorage.getItem('ww.auth_complete');
    if (authCompleteTime && Date.now() - parseInt(authCompleteTime) < 5000) {
      // If auth was completed in the last 5 seconds, don't show modal
      if (open) {
        onOpenChange(false);
      }
    }
  }, [open, onOpenChange]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setMode('welcome');
  }, []);

  const handleModalClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Prevent closing on outside clicks - only allow explicit close
      return;
    }
    onOpenChange(newOpen);
  };

  const handleExplicitClose = () => {
    resetForm();
    onExplicitClose?.();
  };

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode as AuthMode);
  }, []);

  const handleWhopSuccess = useCallback((user: any, authMethod: string) => {
    setAuthenticatedUser?.(user, authMethod);
    onOpenChange(false);
    navigate('/dashboard');
  }, [setAuthenticatedUser, onOpenChange, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous auth completion markers
    sessionStorage.removeItem('ww.auth_complete');
    
    // Prevent double submissions with more aggressive debouncing
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    
    if (isSubmittingRef.current || timeSinceLastSubmit < 3000) {
      console.log('⏳ Preventing duplicate submission - time since last:', timeSinceLastSubmit);
      return;
    }
    
    // Additional check for magic link requests - use request ID to prevent duplicates
    if (mode === 'magic') {
      const requestId = `${email.toLowerCase().trim()}-${now}`;
      if (magicLinkRequestIdRef.current === requestId.substring(0, requestId.lastIndexOf('-'))) {
        console.log('⏳ Preventing duplicate magic link request for same email');
        return;
      }
      magicLinkRequestIdRef.current = requestId.substring(0, requestId.lastIndexOf('-'));
    }
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    setIsLoading(true);
    setError('');
    
    try {
      if (mode === 'magic') {
        console.log('🔄 Sending magic link for:', email.toLowerCase().trim());
        
        // Additional safety check before invoking function
        if (isSubmittingRef.current !== true) {
          console.log('❌ Submit state changed unexpectedly, aborting');
          return;
        }
        
        // Use deduplication system to prevent duplicate requests
        const result = await authRequestDeduplication.deduplicateRequest(
          email.toLowerCase().trim(),
          'magic_link',
          async () => {
            console.log('📧 Actually sending magic link request...');
            
            try {
              const { data, error } = await supabase.functions.invoke('unified-auth-verify', {
                body: { email: email.toLowerCase().trim() }
              });

              console.log('🔍 Supabase function response:', { data, error });

              if (error) {
                console.error('❌ Magic link error:', error);
                throw new Error(error.message || 'Failed to send magic link');
              }
              return data;
            } catch (functionError: any) {
              console.error('❌ Function invocation failed:', functionError);
              throw new Error(functionError.message || 'Network error occurred');
            }
          }
        );
        
        console.log('✅ Magic link result:', result);
        
        // Handle successful verification or magic link sending
        if (result && result.success) {
          if (result.verified && result.session_token) {
            console.log('🎯 User verified and authenticated via magic link');
            
            // Store the session for the auth system to pick up
            localStorage.setItem('auth_user_email', email.toLowerCase().trim());
            localStorage.setItem('enhanced_session_token', result.session_token);
            localStorage.setItem('auth_tier', result.tier || 'free');
            localStorage.setItem('auth_method', 'magic_link');
            
            // Set user context if we have user data
            if (setAuthenticatedUser) {
              const userData = {
                id: crypto.randomUUID(),
                email: email.toLowerCase().trim(),
                subscription_tier: result.tier === 'free' ? 'free' : 'premium',
                user_type: 'unified_user' as const,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setAuthenticatedUser(userData, 'magic_link');
            }
            
            // Success - redirect to dashboard
            onOpenChange(false);
            navigate('/dashboard');
          } else {
            // Magic link sent but not immediately verified
            console.log('📧 Magic link sent, awaiting user action');
            setError(
              <div className="text-green-600 text-sm">
                ✅ Magic link sent! Check your email and click the link to sign in.
              </div>
            );
          }
        } else {
          throw new Error('Failed to process magic link request');
        }
      } else if (mode === 'signin') {
        if (!password.trim()) {
          setError('Please enter your password');
          return;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: password
        });
        
        if (error) {
          setError(error.message);
        } else {
          // After successful Supabase login, verify with unified auth to get proper tier
          console.log('🔄 Verifying user tier after password login...');
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
              body: { email: email.toLowerCase().trim() }
            });
            
            if (verifyData?.success) {
              console.log(`✅ User ${email} verified with tier: ${verifyData.tier}`);
              // The unified auth will handle setting the proper user data
            } else {
              console.warn('⚠️ User verification failed, proceeding with basic auth');
            }
          } catch (verifyError) {
            console.warn('⚠️ Could not verify user tier:', verifyError);
          }
          
          // Mark auth complete to prevent modal reopening
          sessionStorage.setItem('ww.auth_complete', Date.now().toString());
          onOpenChange(false);
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        if (!password.trim()) {
          setError('Please enter a password');
          return;
        }
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) {
          setError(error.message);
        } else {
          setError(
            <div className="text-green-600">
              Account created! Please check your email to verify your account before signing in.
            </div>
          );
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (error: any) {
      console.error('❌ Auth submission error:', error);
      
      // More specific error handling for magic link
      if (mode === 'magic') {
        if (error.message?.includes('subscription') || error.message?.includes('not found')) {
          setError('Email not found in our subscription list. Please check your email or sign up for Weekly Wizdom newsletter first.');
        } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError('Unable to send magic link. Please try again or contact support.');
        }
      } else {
        setError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const renderCurrentView = () => {
    switch (mode) {
      case 'welcome':
        return (
          <WelcomeView
            onModeChange={handleModeChange}
            onWhopSuccess={handleWhopSuccess}
            onClose={handleExplicitClose}
            isLoading={isLoading}
          />
        );
      case 'signin':
        return (
          <SignInView
            mode={mode}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            isLoading={isLoading}
            error={error}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onModeChange={handleModeChange}
            onSubmit={handleSubmit}
            onClose={handleExplicitClose}
          />
        );
      case 'signup':
        return (
          <SignUpView
            mode={mode}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            isLoading={isLoading}
            error={error}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onModeChange={handleModeChange}
            onSubmit={handleSubmit}
            onClose={handleExplicitClose}
          />
        );
      case 'magic':
        return (
          <MagicLinkView
            mode={mode}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            isLoading={isLoading}
            error={error}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onModeChange={handleModeChange}
            onSubmit={handleSubmit}
            onClose={handleExplicitClose}
          />
        );
      default:
        return (
          <WelcomeView
            onModeChange={handleModeChange}
            onWhopSuccess={handleWhopSuccess}
            onClose={handleExplicitClose}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">
          Get access to Weekly Wizdom premium features and newsletter content.
        </DialogDescription>
        
        <Suspense fallback={<AuthModalSkeleton />}>
          {renderCurrentView()}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
});

SimplifiedAuthModal.displayName = 'SimplifiedAuthModal';
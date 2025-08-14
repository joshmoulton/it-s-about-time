
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'sonner';
import { validateEmail, validatePassword, secureAuthAction, sanitizeInput } from '@/utils/authSecurity';

export const useLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useEnhancedAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const method = searchParams.get('method') || 'signin';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleTabClick = (tabKey: string) => {
    setSearchParams({ method: tabKey });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced input validation and sanitization
    const sanitizedEmail = await sanitizeInput(email, 'email');
    
    // Validate email
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.valid) {
      toast.error(emailValidation.errors[0]);
      return;
    }

    // Validate password if required
    if (method === 'signin' || method === 'signup') {
      if (!password.trim()) {
        toast.error('Please enter your password');
        return;
      }
      
      if (method === 'signup') {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          toast.error(passwordValidation.errors[0]);
          return;
        }
      }
    }

    setIsLoading(true);
    
    try {
      await secureAuthAction(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        
        if (method === 'magic') {
          // REMOVED MAGIC LINK - Now handled only by SimplifiedAuthModal
          console.log(`🚫 useLoginForm: Magic link removed - use SimplifiedAuthModal instead`);
          throw new Error('Please use the main authentication modal for magic links.');
        } else if (method === 'signin') {
          // First verify with Beehiiv API
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
            body: { email: sanitizedEmail }
          });

          if (verifyError || !verifyData?.success || !verifyData?.verified) {
            throw new Error('Email not found in subscriber list. Please use magic link to get started.');
          }

          // Then authenticate with Supabase (creates temporary session)
          const { data, error } = await supabase.auth.signInWithPassword({
            email: sanitizedEmail,
            password: password
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          toast.success('Successfully signed in!');
          navigate('/dashboard');
        } else if (method === 'signup') {
          // First verify with Beehiiv API before allowing signup
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('beehiiv-subscriber-verify', {
            body: { email: sanitizedEmail }
          });

          if (verifyError || !verifyData?.success || !verifyData?.verified) {
            throw new Error('Email not found in subscriber list. Please use magic link to get started.');
          }
          
          const { data, error } = await supabase.auth.signUp({
            email: sanitizedEmail,
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          toast.success('Account created! Please check your email to verify your account.');
          setEmail('');
          setPassword('');
        }
      }, 'authentication', sanitizedEmail);
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    method,
    handleTabClick,
    handleSubmit,
  };
};

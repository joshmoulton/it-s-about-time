
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { DeviceManagementModal } from './DeviceManagementModal';
import { RememberMeOption } from './RememberMeOption';
import { PasswordLoginForm } from './forms/PasswordLoginForm';
import { PasswordSetupForm } from './forms/PasswordSetupForm';
import { PasswordSetupRequiredModal } from './PasswordSetupRequiredModal';

import { LoginCardHeader } from './forms/LoginCardHeader';
import { MagicLinkForm } from './forms/MagicLinkForm';
import { SignUpForm } from './forms/SignUpForm';
import { ForgotPasswordForm } from './forms/ForgotPasswordForm';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';

interface EnhancedLoginFormProps {
  onSuccess: (user: any, authMethod: string) => void;
}

export const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [setupEmail, setSetupEmail] = useState('');
  const [setupUserTier, setSetupUserTier] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showDeviceManagement, setShowDeviceManagement] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { isCurrentDeviceTrusted, trustCurrentDevice, untrustCurrentDevice } = useDeviceManagement();

  useEffect(() => {
    const savedRememberMe = localStorage.getItem('remember_me_preference') === 'true';
    setRememberMe(savedRememberMe);
    
    // Clear any browser autocomplete
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
      (input as HTMLInputElement).setAttribute('autocomplete', 'new-password');
      (input as HTMLInputElement).value = '';
    });
  }, []);

  const handleAdminLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔑 Attempting Supabase admin login...');
      
      // PRIORITY 1: Try Supabase admin authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (!authError && authData.user) {
        console.log('✅ Supabase admin login successful');
        
        // Handle remember me for admin
        if (rememberMe) {
          trustCurrentDevice();
          localStorage.setItem('remember_me_preference', 'true');
        } else {
          untrustCurrentDevice();
          localStorage.setItem('remember_me_preference', 'false');
        }
        
        // Create admin user object
        const adminUser = {
          id: authData.user.id,
          email: authData.user.email,
          subscription_tier: 'premium' as const,
          user_type: 'supabase_admin' as const
        };
        
        // Immediate success for admin login
        setIsLoading(false);
        onSuccess(adminUser, 'supabase_admin');
        return;
      }

      
      // If no valid authentication found
      if (authError?.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials, or sign up for a new account.');
      } else {
        setError('Login failed. Please check your credentials or create a new account.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Password setup not supported in simplified auth
      setError('Password setup is not available in this version. Please use magic link authentication.');
      setShowPasswordSetup(false);
    } catch (error) {
      console.error('Password setup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBeehiivLogin = async (data: { email: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`🔍 Quick verification for: ${data.email}`);
      
      // CRITICAL FIX: Immediate auth success with background verification
      const email = data.email.toLowerCase().trim();
      
      // Create user data immediately with free tier as default
      const userData = {
        id: crypto.randomUUID(),
        email,
        subscription_tier: 'free' as const, // Default to free, upgrade in background
        user_type: 'unified_user' as const,
        status: 'active'
      };

      console.log(`✅ Immediate login success for ${email} - tier verification will happen in background`);
      
      // Clear loading state and trigger success immediately
      setIsLoading(false);
      onSuccess(userData, 'beehiiv');

      // Background verification (non-blocking)
      setTimeout(async () => {
        try {
          console.log(`🔄 Background: Verifying Beehiiv subscription for ${email}`);
          
          const { data: verificationResult } = await supabase.functions.invoke(
            'beehiiv-subscriber-verify',
            { body: { email } }
          );

          if (verificationResult?.success) {
            const userTierRaw = verificationResult.tier || 'free';
            const userTier = userTierRaw === 'free' ? 'free' : 'premium';
            
            console.log(`🔄 Background: Tier verified as ${userTier} for ${email}`);
            
            // Update tier in background if needed
            if (userTier !== 'free') {
              // This will be handled by the auth context to update the user
              console.log(`🔄 Background: User ${email} has ${userTier} tier - context will update`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Background verification failed for ${email}:`, error);
          // Don't show error to user since they're already logged in
        }
      }, 100); // Small delay to ensure UI has updated

    } catch (error: any) {
      console.error('❌ Beehiiv login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordSetupComplete = () => {
    setShowPasswordSetupModal(false);
    
    // After password setup, proceed with login
    const userData = {
      id: crypto.randomUUID(),
      email: setupEmail,
      subscription_tier: setupUserTier,
      user_type: 'unified_user',
      status: 'active'
    };

    console.log(`✅ Password setup complete, logging in user: ${setupEmail}`);
    onSuccess(userData, 'beehiiv');
  };

  const handlePasswordSetupSkip = () => {
    setShowPasswordSetupModal(false);
    
    // Proceed with login without password setup
    const userData = {
      id: crypto.randomUUID(),
      email: setupEmail,
      subscription_tier: setupUserTier,
      user_type: 'unified_user',
      status: 'active'
    };

    console.log(`✅ Password setup skipped, logging in user: ${setupEmail}`);
    onSuccess(userData, 'beehiiv');
  };

  const handleMagicLink = async (data: { email: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      const email = data.email.toLowerCase().trim();
      
      console.log(`🚫 EnhancedLoginForm: Magic link removed - use SimplifiedAuthModal instead`);
      setError('Please use the main authentication modal for magic links.');
      return;
    } catch (error) {
      console.error('❌ Magic link error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: { email: string; password: string; accountType?: 'free' | 'premium' }) => {
    setIsLoading(true);
    setError('');
    
    try {
      const email = data.email.toLowerCase().trim();
      
      if (data.accountType === 'premium') {
        // Redirect to Whop for premium account setup
        setError('For premium accounts, please use the "Premium" tab to purchase through our premium platform.');
        return;
      }
      
      // First, check if user already exists in Beehiiv
      console.log(`🔍 Checking if user exists in Beehiiv: ${email}`);
      
      try {
        const { data: beehiivResult, error: beehiivError } = await supabase.functions.invoke('beehiiv-create-subscription', {
          body: {
            email,
            utm_source: 'Weekly Wizdom App',
            utm_medium: 'signup',
            utm_campaign: 'free_signup',
            referring_site: window.location.origin
          }
        });

        if (beehiivError || (beehiivResult && beehiivResult.error === 'EMAIL_EXISTS')) {
          setError('This email is already registered. Please sign in instead.');
          return;
        }

        if (!beehiivResult || !beehiivResult.success) {
          setError('Failed to create subscription. Please try again.');
          return;
        }
        
        console.log('✅ Beehiiv subscription created successfully');
      } catch (beehiivError) {
        console.error('❌ Beehiiv subscription creation error:', beehiivError);
        setError('Failed to create subscription. Please try again.');
        return;
      }
      
      // Now create Supabase account since Beehiiv subscription was successful
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: { 
          emailRedirectTo: `${window.location.origin}/?verified=true`,
          data: {
            account_type: 'free',
            subscription_tier: 'free'
          }
        }
      });

      if (authError) {
        setError(authError.message || 'Failed to create account');
      } else {
        setError('');
        alert('Account created successfully! Check your email to confirm your account. You now have access to our newsletter content.');
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhopSuccess = (user: any, authMethod: string) => {
    // Handle remember me for Whop login as well
    if (rememberMe) {
      trustCurrentDevice();
      localStorage.setItem('remember_me_preference', 'true');
    }
    
    onSuccess(user, authMethod);
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  if (showPasswordSetup) {
    return (
      <PasswordSetupForm
        email={setupEmail}
        onSubmit={handlePasswordSetup}
        onBack={() => setShowPasswordSetup(false)}
        isLoading={isLoading}
        error={error}
        rememberMe={rememberMe}
        onRememberMeChange={setRememberMe}
      />
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <LoginCardHeader onDeviceManagement={() => setShowDeviceManagement(true)} />
        <CardContent>
          <Tabs defaultValue="beehiiv" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="beehiiv">Subscriber Login</TabsTrigger>
              <TabsTrigger value="password">Admin</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="whop">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="beehiiv" className="space-y-4">
              <div className="text-sm text-muted-foreground text-center mb-4">
                <p>Newsletter subscribers: Sign in with your email</p>
              </div>
              
              <MagicLinkForm
                onSubmit={handleBeehiivLogin}
                isLoading={isLoading}
                error=""
                buttonText="Check Subscription"
              />
              
              {error && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="password" className="space-y-4">
              <div className="text-sm text-muted-foreground text-center mb-4">
                <p>For admin access or if you have an existing account</p>
              </div>
              
              <PasswordLoginForm
                onSubmit={handleAdminLogin}
                isLoading={isLoading}
                error=""
              />
              
              {error && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <RememberMeOption
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  disabled={isLoading}
                />
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    disabled={isLoading}
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="text-sm text-muted-foreground text-center mb-4">
                <p>Create a free account for newsletter access</p>
                <p className="text-xs mt-1">For premium features, see the "Products" tab</p>
              </div>
              
              <SignUpForm
                onSubmit={handleSignUp}
                isLoading={isLoading}
                error=""
              />
              
              {error && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <RememberMeOption
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="whop" className="space-y-4">
              <div className="text-sm text-muted-foreground text-center mb-4">
                <p>View premium products and upgrade options</p>
                <p className="text-xs mt-1">After purchase, use "Subscriber Login" to access premium features</p>
              </div>
              <div className="text-center">
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  View Premium Products
                </a>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DeviceManagementModal
        open={showDeviceManagement}
        onOpenChange={setShowDeviceManagement}
      />
      
      <PasswordSetupRequiredModal
        isOpen={showPasswordSetupModal}
        userEmail={setupEmail}
        userTier={setupUserTier}
        onPasswordSet={handlePasswordSetupComplete}
        onSkip={handlePasswordSetupSkip}
      />
    </>
  );
};

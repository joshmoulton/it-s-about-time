
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
        
        // Clear loading state before calling onSuccess
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
      console.log(`🔍 Checking Beehiiv subscription for: ${data.email}`);
      
      // Verify with Beehiiv API first
      const { data: verificationResult, error: verifyError } = await supabase.functions.invoke(
        'beehiiv-subscriber-verify',
        { body: { email: data.email.toLowerCase().trim() } }
      );

      if (verifyError || !verificationResult?.success) {
        setError('No active subscription found for this email. Please check your email address or subscribe to Weekly Wizdom first.');
        return;
      }

      // Check if user exists in local database
      const { data: subscriber, error: subscriberError } = await supabase
        .from('beehiiv_subscribers')
        .select('requires_password_setup, subscription_tier, id')
        .eq('email', data.email.toLowerCase().trim())
        .single();

      let localSubscriber = subscriber;
      const userTierRaw = verificationResult.tier || 'free';
      const userTier = userTierRaw === 'free' ? 'free' : 'premium';

      // If user doesn't exist in local database but exists in Beehiiv, create local record
      if (subscriberError && subscriberError.code === 'PGRST116') {
        console.log(`🆕 Creating local database record for Beehiiv user: ${data.email}`);
        
        try {
          const { data: newSubscriber, error: createError } = await supabase
            .from('beehiiv_subscribers')
            .insert({
              email: data.email.toLowerCase().trim(),
              subscription_tier: userTier,
              requires_password_setup: false, // Make password setup optional
              status: 'active',
              metadata: {
                source: 'beehiiv_sync',
                created_from: 'enhanced_login',
                beehiiv_tier: verificationResult.tier
              }
            })
            .select('requires_password_setup, subscription_tier, id')
            .single();

          if (createError) {
            console.error('❌ Failed to create local subscriber record:', createError);
            // Continue with login even if local record creation fails
            localSubscriber = {
              requires_password_setup: false,
              subscription_tier: userTier,
              id: null
            };
          } else {
            console.log('✅ Local subscriber record created successfully');
            localSubscriber = newSubscriber;
          }
        } catch (createError) {
          console.error('❌ Error creating local subscriber:', createError);
          // Continue with login using Beehiiv data
          localSubscriber = {
            requires_password_setup: false,
            subscription_tier: userTier,
            id: null
          };
        }
      } else if (subscriberError) {
        console.error('❌ Database error checking subscriber:', subscriberError);
        // Continue with login using Beehiiv data
        localSubscriber = {
          requires_password_setup: false,
          subscription_tier: userTier,
          id: null
        };
      }

      const requiresPasswordSetup = localSubscriber?.requires_password_setup ?? false;

      if (requiresPasswordSetup) {
        // Show password setup modal
        setSetupEmail(data.email.toLowerCase().trim());
        setSetupUserTier(userTier);
        setShowPasswordSetupModal(true);
        return;
      }

      // User exists and password is set up, proceed with regular authentication flow
      const userData = {
        id: crypto.randomUUID(),
        email: data.email.toLowerCase().trim(),
        subscription_tier: userTier,
        user_type: 'unified_user',
        status: 'active'
      };

      console.log(`✅ Beehiiv login successful for ${data.email}, tier: ${userTier}`);
      
      // Clear loading state before calling onSuccess
      setIsLoading(false);
      onSuccess(userData, 'beehiiv');

    } catch (error: any) {
      console.error('❌ Beehiiv login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
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
      
      // First, verify user exists in Beehiiv or create a free subscription
      console.log(`🔍 Checking Beehiiv subscription for magic link: ${email}`);
      
      const { data: verificationResult, error: verifyError } = await supabase.functions.invoke(
        'beehiiv-subscriber-verify',
        { body: { email } }
      );

      if (verifyError || !verificationResult?.success) {
        // User doesn't exist in Beehiiv, create free subscription first
        console.log('🆕 User not found in Beehiiv, creating free subscription...');
        
        const { data: beehiivResult, error: beehiivError } = await supabase.functions.invoke('beehiiv-create-subscription', {
          body: {
            email,
            utm_source: 'Weekly Wizdom App',
            utm_medium: 'magic_link',
            utm_campaign: 'free_signup',
            referring_site: window.location.origin
          }
        });

        if (beehiivError || !beehiivResult?.success) {
          if (beehiivResult?.error === 'EMAIL_EXISTS') {
            // Continue with magic link even if they already exist
            console.log('ℹ️ User already exists in Beehiiv, proceeding with magic link...');
          } else {
            setError('Failed to verify subscription. Please try again.');
            return;
          }
        } else {
          console.log('✅ Free Beehiiv subscription created, proceeding with magic link...');
        }
      }
      
      // Send magic link via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (!error) {
        console.log('✅ Magic link sent successfully');
        setError('Magic link sent! Check your email and click the link to sign in.');
      } else {
        setError(error.message || 'Failed to send magic link. Please check your email address.');
      }
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
          emailRedirectTo: `${window.location.origin}/login?method=signin`,
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

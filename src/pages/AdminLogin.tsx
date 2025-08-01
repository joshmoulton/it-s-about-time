
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2 } from 'lucide-react';
import { TwoFactorVerification } from '@/components/admin/TwoFactorVerification';
import { TwoFactorAuthManager } from '@/utils/twoFactorAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard'); // Always redirect to dashboard
      }
    };
    checkAuth();
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        console.log('✅ Admin login successful:', data.user.email);
        setUserEmail(data.user.email);
        
        // Check if user has 2FA enabled
        const has2FA = await TwoFactorAuthManager.checkAdminHas2FAEnabled(data.user.email);
        
        if (has2FA) {
          setShowTwoFactor(true);
        } else {
          // 2FA is mandatory - redirect to setup
          setError('Two-factor authentication is required for admin access. Please contact your administrator to set up 2FA.');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASuccess = (sessionToken: string) => {
    console.log('✅ 2FA verification successful');
    
    // Store the 2FA session token in localStorage for admin access validation
    localStorage.setItem('admin_2fa_session', sessionToken);
    
    navigate('/admin');
  };

  const handle2FACancel = () => {
    setShowTwoFactor(false);
    // Clear 2FA session and sign out the user since they cancelled 2FA
    localStorage.removeItem('admin_2fa_session');
    supabase.auth.signOut();
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <TwoFactorVerification
          adminEmail={userEmail}
          onVerificationSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
          operation="admin panel access"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-cyan-400" />
              <CardTitle className="text-2xl font-bold text-white">
                Admin Access
              </CardTitle>
            </div>
            <CardDescription className="text-slate-300">
              Sign in with your administrator credentials
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-slate-200">
                  Email Address
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-slate-200">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {error && (
                <Alert className="bg-red-900/20 border-red-700 text-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In to Admin Panel'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white"
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;

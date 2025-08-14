import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | React.ReactNode>('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useEnhancedAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      console.log('🔄 Sending magic link for:', email.toLowerCase().trim());
      
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: { email: email.toLowerCase().trim() }
      });
      
      if (error || !data?.success) {
        const errorMessage = data?.error || error?.message || 'Failed to send access link';
        console.error('❌ Magic link error:', errorMessage);
        setError(errorMessage);
      } else {
        console.log('✅ Magic link sent successfully');
        if (data.is_new_user) {
          setMessage(
            <div className="text-green-600">
              Welcome! We've created your free Weekly Wizdom account and sent an access link to your email. 
              Check your inbox and click the link to get started.
            </div>
          );
        } else {
          setMessage(
            <div className="text-green-600">
              Access link sent! Check your email and click the link to sign in.
            </div>
          );
        }
        setEmail('');
      }
    } catch (error) {
      console.error('❌ Magic link submission error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Access Weekly Wizdom</CardTitle>
            <CardDescription>
              Enter your email to receive an instant access link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              {message && (
                <div className="text-sm bg-green-50 p-3 rounded-md border border-green-200">
                  {message}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending access link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send access link
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                No password required. We'll send you a secure link to access your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
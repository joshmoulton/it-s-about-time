import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Mail, User, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/secureLogger';

interface PasswordSetupRequiredModalProps {
  isOpen: boolean;
  userEmail: string;
  userTier: string;
  onPasswordSet: () => void;
  onSkip: () => void;
}

export const PasswordSetupRequiredModal: React.FC<PasswordSetupRequiredModalProps> = ({
  isOpen,
  userEmail,
  userTier,
  onPasswordSet,
  onSkip
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'paid': return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return <Crown className="h-4 w-4" />;
      case 'paid': return <User className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;

    setIsLoading(true);
    setError('');

    try {
      // Call edge function to set up password and verify Beehiiv status
      const { data, error } = await supabase.functions.invoke('setup-user-password', {
        body: {
          email: userEmail,
          password: password
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        logger.info('✅ Password setup successful', { email: userEmail });
        onPasswordSet();
      } else {
        throw new Error(data?.error || 'Failed to set up password');
      }
    } catch (error: any) {
      console.error('Password setup error:', error);
      setError(error.message || 'Failed to set up password. Please try again.');
      logger.error('❌ Password setup failed', { 
        email: userEmail, 
        error: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Your Account
            </DialogTitle>
          </DialogHeader>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Welcome back!</CardTitle>
                  <CardDescription>
                    Your subscription is verified and active
                  </CardDescription>
                </div>
                <Badge className={getTierColor(userTier)}>
                  <span className="flex items-center gap-1">
                    {getTierIcon(userTier)}
                    {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {userEmail}
              </div>
              
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  To secure your account and ensure continued access, we recommend setting up a password. 
                  This allows you to log in even if you don't have access to your email.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => setShowForm(true)}
                  className="flex-1"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Set Up Password
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onSkip}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Create Your Password
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handlePasswordSetup} className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {userEmail}
            <Badge className={getTierColor(userTier)} variant="outline">
              {getTierIcon(userTier)}
              {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
            </Badge>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !password || !confirmPassword}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
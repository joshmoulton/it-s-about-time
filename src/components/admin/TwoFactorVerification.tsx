import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { TwoFactorAuthManager, TwoFactorSession } from '@/utils/twoFactorAuth';
import { toast } from 'sonner';

interface TwoFactorVerificationProps {
  adminEmail: string;
  onVerificationSuccess: (sessionToken: string) => void;
  onCancel?: () => void;
  operation?: string;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  adminEmail,
  onVerificationSuccess,
  onCancel,
  operation = 'sensitive operation'
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await TwoFactorAuthManager.verifyTwoFactor(adminEmail, verificationCode);
      
      if (isValid) {
        const sessionToken = await TwoFactorAuthManager.createSecureSession(adminEmail, 15);
        await TwoFactorAuthManager.markSessionVerified(sessionToken);
        
        TwoFactorSession.storeSession(sessionToken);
        TwoFactorSession.markVerified();
        
        toast.success('2FA verification successful');
        onVerificationSuccess(sessionToken);
      } else {
        toast.error('Invalid verification code. Please try again.');
        setVerificationCode('');
      }
    } catch (error) {
      toast.error(`Failed to verify 2FA: ${error}`);
    }
    setIsVerifying(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length >= (useBackupCode ? 8 : 6)) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter your verification code to access {operation}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This action requires additional verification for security.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
            </label>
            <Input
              type="text"
              placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
              value={verificationCode}
              onChange={(e) => {
                const value = useBackupCode 
                  ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
                  : e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              onKeyPress={handleKeyPress}
              maxLength={useBackupCode ? 8 : 6}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length < (useBackupCode ? 8 : 6)}
              className="flex-1"
            >
              {isVerifying ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
            
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={isVerifying}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode('');
              }}
              className="text-xs"
            >
              {useBackupCode 
                ? 'Use authenticator code instead' 
                : 'Use backup code instead'
              }
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <div>
            {useBackupCode 
              ? 'Enter one of your 8-character backup codes'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </div>
          <div>This session will expire in 15 minutes</div>
        </div>
      </CardContent>
    </Card>
  );
};
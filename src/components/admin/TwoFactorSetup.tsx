import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, Download, RefreshCw, QrCode } from 'lucide-react';
import { TwoFactorAuthManager, TwoFactorSetup as TwoFactorSetupData } from '@/utils/twoFactorAuth';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  adminEmail: string;
  onSetupComplete?: () => void;
  onCancel?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  adminEmail,
  onSetupComplete,
  onCancel
}) => {
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await TwoFactorAuthManager.setupTwoFactor(adminEmail);
      setSetupData(data);
      setStep('verify');
      toast.success('2FA setup initiated. Scan the QR code with your authenticator app.');
    } catch (error) {
      toast.error(`Failed to setup 2FA: ${error}`);
    }
    setIsLoading(false);
  };

  const handleVerifySetup = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const success = await TwoFactorAuthManager.enableTwoFactor(adminEmail, verificationCode);
      
      if (success) {
        setStep('complete');
        toast.success('2FA enabled successfully!');
        onSetupComplete?.();
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } catch (error) {
      toast.error(`Failed to verify 2FA: ${error}`);
    }
    setIsVerifying(false);
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${description} copied to clipboard`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `Weekly Wizdom Admin - 2FA Backup Codes
Generated: ${new Date().toISOString()}
Email: ${adminEmail}

IMPORTANT: Store these codes securely. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to regain access to your account.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2fa-backup-codes-${adminEmail}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Backup codes downloaded');
  };

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-success" />
          </div>
          <CardTitle className="text-success">2FA Setup Complete!</CardTitle>
          <CardDescription>
            Your account is now protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is now required for accessing sensitive admin functions.
            </AlertDescription>
          </Alert>
          
          {setupData && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Backup Codes</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {setupData.backupCodes.map((code, index) => (
                  <Badge key={index} variant="outline" className="justify-center">
                    {code}
                  </Badge>
                ))}
              </div>
              <Button
                onClick={downloadBackupCodes}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Backup Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Setup Two-Factor Authentication</CardTitle>
        <CardDescription>
          {step === 'setup' 
            ? 'Secure your admin account with 2FA'
            : 'Scan the QR code and enter the verification code'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {step === 'setup' && (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                2FA adds an extra layer of security by requiring a verification code from your phone.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleStartSetup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Setting up...' : 'Start Setup'}
            </Button>
          </div>
        )}

        {step === 'verify' && setupData && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="text-sm font-medium">1. Scan QR Code</div>
              <div className="bg-brand-white p-4 rounded-lg inline-block">
                <img 
                  src={setupData.qrCodeUrl} 
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Use Google Authenticator, Authy, or similar app
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">2. Or enter manually:</div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {setupData.secret}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(setupData.secret, 'Secret key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">3. Enter verification code:</div>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <Button
                onClick={handleVerifySetup}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                {isVerifying ? 'Verifying...' : 'Verify & Enable 2FA'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
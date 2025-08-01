import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Settings, Download, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { TwoFactorAuthManager } from '@/utils/twoFactorAuth';
import { TwoFactorSetup } from './TwoFactorSetup';
import { TwoFactorVerification } from './TwoFactorVerification';
import { toast } from 'sonner';

interface TwoFactorManagerProps {
  adminEmail: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  lastUsed?: string;
  backupCodesRemaining?: number;
}

export const TwoFactorManager: React.FC<TwoFactorManagerProps> = ({
  adminEmail
}) => {
  const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadTwoFactorStatus();
  }, [adminEmail]);

  const loadTwoFactorStatus = async () => {
    setIsLoading(true);
    try {
      const twoFactorStatus = await TwoFactorAuthManager.getTwoFactorStatus(adminEmail);
      setStatus(twoFactorStatus);
    } catch (error) {
      toast.error(`Failed to load 2FA status: ${error}`);
    }
    setIsLoading(false);
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadTwoFactorStatus();
  };

  const handleVerificationSuccess = async (sessionToken: string) => {
    setShowVerification(false);
    
    if (pendingAction === 'disable') {
      // Disable 2FA is already verified by the verification component
      await loadTwoFactorStatus();
      toast.success('2FA has been disabled');
    } else if (pendingAction === 'regenerate') {
      try {
        // The verification was already done, so we can regenerate codes
        // We need to get a fresh verification for regeneration
        setShowVerification(true);
        setPendingAction('regenerate_confirmed');
      } catch (error) {
        toast.error(`Failed to regenerate backup codes: ${error}`);
      }
    } else if (pendingAction === 'regenerate_confirmed') {
      // This is a bit hacky, but we need to verify again for regeneration
      // In a real app, you'd pass the session token to the regeneration function
      setShowVerification(false);
      setPendingAction('');
    }
    
    setPendingAction('');
  };

  const requestDisable2FA = () => {
    setPendingAction('disable');
    setShowVerification(true);
  };

  const requestRegenerateBackupCodes = () => {
    setPendingAction('regenerate');
    setShowVerification(true);
  };

  const downloadBackupCodes = () => {
    if (newBackupCodes.length === 0) return;

    const content = `Weekly Wizdom Admin - 2FA Backup Codes
Generated: ${new Date().toISOString()}
Email: ${adminEmail}

IMPORTANT: Store these codes securely. Each code can only be used once.

${newBackupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

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
    setNewBackupCodes([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading 2FA status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                status.enabled ? 'bg-success/10' : 'bg-muted'
              }`}>
                <Shield className={`w-6 h-6 ${
                  status.enabled ? 'text-success' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Two-Factor Authentication</span>
                  <Badge variant={status.enabled ? 'default' : 'secondary'}>
                    {status.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {status.enabled 
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security to your account'
                  }
                </CardDescription>
              </div>
            </div>
            
            {status.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetup(false)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!status.enabled ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is required for admin accounts to access sensitive data.
                </AlertDescription>
              </Alert>
              
              <Button onClick={() => setShowSetup(true)} className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Setup Two-Factor Authentication
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Status</div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-success font-medium">Active</span>
                  </div>
                </div>
                
                {status.lastUsed && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Last Used</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(status.lastUsed).toLocaleString()}
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className="text-sm font-medium">Backup Codes</div>
                  <div className="text-sm text-muted-foreground">
                    {status.backupCodesRemaining || 0} codes remaining
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestRegenerateBackupCodes}
                  disabled={(status.backupCodesRemaining || 0) > 5}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestDisable2FA}
                  className="text-destructive hover:text-destructive"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>

              {(status.backupCodesRemaining || 0) <= 2 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have {status.backupCodesRemaining || 0} backup codes remaining. 
                    Consider regenerating new codes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Backup Codes Display */}
      {newBackupCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-success">New Backup Codes Generated</CardTitle>
            <CardDescription>
              Save these codes in a secure location. Each code can only be used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {newBackupCodes.map((code, index) => (
                <Badge key={index} variant="outline" className="justify-center">
                  {code}
                </Badge>
              ))}
            </div>
            <Button onClick={downloadBackupCodes} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Backup Codes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <TwoFactorSetup
            adminEmail={adminEmail}
            onSetupComplete={handleSetupComplete}
            onCancel={() => setShowSetup(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Identity</DialogTitle>
          </DialogHeader>
          <TwoFactorVerification
            adminEmail={adminEmail}
            onVerificationSuccess={handleVerificationSuccess}
            onCancel={() => {
              setShowVerification(false);
              setPendingAction('');
            }}
            operation={pendingAction === 'disable' ? 'disable 2FA' : 'regenerate backup codes'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
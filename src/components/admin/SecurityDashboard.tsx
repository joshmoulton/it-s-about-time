import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe, 
  Smartphone,
  Download,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { TwoFactorAuthManager } from '@/utils/twoFactorAuth';
import { TwoFactorSetup } from './TwoFactorSetup';
import { TwoFactorVerification } from './TwoFactorVerification';

interface SecurityDashboardProps {
  adminEmail: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  event_details: any;
  success: boolean;
  ip_address: string;
  user_agent: string;
  device_fingerprint: string;
  created_at: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ adminEmail }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [has2FA, setHas2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableVerification, setShowDisableVerification] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, [adminEmail]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Load 2FA status
      const tfaStatus = await TwoFactorAuthManager.getTwoFactorStatus(adminEmail);
      setHas2FA(tfaStatus.enabled);
      
      // For now, set empty events array - will be implemented with proper API
      setSecurityEvents([]);
    } catch (error) {
      toast.error('Failed to load security data');
      console.error('Security data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup2FA = () => {
    setShowSetup(true);
  };

  const handleDisable2FA = () => {
    setShowDisableVerification(true);
  };

  const handle2FASetupComplete = () => {
    setShowSetup(false);
    setHas2FA(true);
    loadSecurityData();
    toast.success('2FA has been enabled successfully');
  };

  const handle2FADisableVerification = async (sessionToken?: string) => {
    setShowDisableVerification(false);
    setHas2FA(false);
    loadSecurityData();
    toast.success('2FA has been disabled');
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    
    switch (eventType) {
      case 'login_attempt':
      case '2fa_verify':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case '2fa_setup':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'sensitive_access_success':
        return <Activity className="h-4 w-4 text-success" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventDescription = (event: SecurityEvent) => {
    const { event_type, event_details, success } = event;
    
    switch (event_type) {
      case 'login_attempt':
        return success ? 'Successful admin login' : 'Failed login attempt';
      case '2fa_setup':
        return 'Two-factor authentication setup';
      case '2fa_verify':
        return `2FA verification using ${event_details.method || 'TOTP'}`;
      case '2fa_disabled':
        return 'Two-factor authentication disabled';
      case 'failed_2fa':
        return `Failed 2FA attempt: ${event_details.reason || 'Unknown'}`;
      case 'sensitive_access_success':
        return `Accessed sensitive operation: ${event_details.operation || 'Unknown'}`;
      case 'sensitive_access_no_2fa':
        return `Blocked sensitive access - 2FA required: ${event_details.operation || 'Unknown'}`;
      case 'sensitive_access_invalid_2fa':
        return `Blocked sensitive access - invalid 2FA: ${event_details.operation || 'Unknown'}`;
      default:
        return event_type.replace(/_/g, ' ');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        adminEmail={adminEmail}
        onSetupComplete={handle2FASetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (showDisableVerification) {
    return (
      <TwoFactorVerification
        adminEmail={adminEmail}
        operation="disable two-factor authentication"
        onVerificationSuccess={handle2FADisableVerification}
        onCancel={() => setShowDisableVerification(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">Manage your account security and monitor activity</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className={`h-8 w-8 ${has2FA ? 'text-success' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Two-Factor Auth</p>
                  <p className="text-sm text-muted-foreground">
                    {has2FA ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Badge variant={has2FA ? 'default' : 'destructive'}>
                {has2FA ? 'Secure' : 'At Risk'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Recent Activity</p>
                <p className="text-sm text-muted-foreground">
                  {securityEvents.length} events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-info" />
              <div>
                <p className="font-medium">Session Status</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Current security configuration for your admin account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!has2FA && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your account is not protected with two-factor authentication. We strongly recommend enabling 2FA for enhanced security.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 ${has2FA ? 'text-success' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {has2FA ? 'Active and protecting your account' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={has2FA ? 'default' : 'outline'}>
                    {has2FA ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Device Recognition</p>
                      <p className="text-sm text-muted-foreground">Track trusted devices</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Activity</CardTitle>
              <CardDescription>Recent security events for your account</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading security events...</p>
                </div>
              ) : securityEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No security events found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getEventIcon(event.event_type, event.success)}
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{getEventDescription(event)}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(event.created_at)}
                          </span>
                          {event.ip_address && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {event.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={event.success ? 'default' : 'destructive'}>
                        {event.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {has2FA 
                        ? 'Protect your account with an additional verification step'
                        : 'Add an extra layer of security to your account'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {has2FA ? (
                      <Button variant="outline" onClick={handleDisable2FA}>
                        Disable
                      </Button>
                    ) : (
                      <Button onClick={handleSetup2FA}>
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                </div>

                {has2FA && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Backup Codes</p>
                      <p className="text-sm text-muted-foreground">
                        Download new backup codes if you've used them
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Generate New
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Security Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about suspicious account activity
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
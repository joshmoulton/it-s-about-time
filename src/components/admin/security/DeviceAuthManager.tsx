import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Smartphone, Monitor, Shield, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authorizeDevice, type DeviceAuth } from '@/utils/securityUtils';
import { supabase } from '@/integrations/supabase/client';

interface DeviceAuthManagerProps {
  devices: DeviceAuth[];
  onUpdate: () => void;
  currentDeviceFingerprint: string;
}

export const DeviceAuthManager: React.FC<DeviceAuthManagerProps> = ({
  devices,
  onUpdate,
  currentDeviceFingerprint
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let deviceType = 'unknown';
    let deviceName = 'Unknown Device';

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = 'mobile';
      if (/iPhone/.test(userAgent)) deviceName = 'iPhone';
      else if (/iPad/.test(userAgent)) deviceName = 'iPad';
      else if (/Android/.test(userAgent)) deviceName = 'Android Device';
    } else {
      deviceType = 'desktop';
      if (/Windows/.test(userAgent)) deviceName = 'Windows PC';
      else if (/Mac/.test(userAgent)) deviceName = 'Mac';
      else if (/Linux/.test(userAgent)) deviceName = 'Linux PC';
    }

    return { deviceType, deviceName };
  };

  const authorizeCurrentDevice = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No authenticated user');
      }

      const { deviceType, deviceName } = getCurrentDeviceInfo();
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      };

      const success = await authorizeDevice(
        user.email,
        currentDeviceFingerprint,
        deviceName,
        deviceType,
        browserInfo
      );

      if (success) {
        toast({
          title: "Success",
          description: "Current device has been authorized"
        });
        onUpdate();
      } else {
        throw new Error('Failed to authorize device');
      }
    } catch (error) {
      console.error('Failed to authorize device:', error);
      toast({
        title: "Error",
        description: "Failed to authorize device",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_device_auth')
        .update({ is_trusted: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Device authorization revoked"
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to revoke device:', error);
      toast({
        title: "Error",
        description: "Failed to revoke device authorization",
        variant: "destructive"
      });
    }
  };

  const getDeviceIcon = (deviceType: string | undefined) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getDeviceStatus = (device: DeviceAuth) => {
    if (!device.is_trusted) return { label: 'Revoked', color: 'bg-destructive' };
    if (device.expires_at && new Date(device.expires_at) < new Date()) {
      return { label: 'Expired', color: 'bg-warning' };
    }
    return { label: 'Trusted', color: 'bg-success' };
  };

  const currentDeviceAuthorized = devices.some(
    device => device.device_fingerprint === currentDeviceFingerprint && device.is_trusted
  );

  return (
    <div className="space-y-4">
      {/* Current Device Alert */}
      {!currentDeviceAuthorized && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Current device is not authorized 
              (ID: {currentDeviceFingerprint.substring(0, 8)}...)
            </span>
            <Button size="sm" onClick={authorizeCurrentDevice} disabled={loading}>
              {loading ? 'Authorizing...' : 'Authorize This Device'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {currentDeviceAuthorized && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Current device is authorized and trusted 
            (ID: {currentDeviceFingerprint.substring(0, 8)}...)
          </AlertDescription>
        </Alert>
      )}

      {/* Authorized Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authorized Devices ({devices.filter(d => d.is_trusted).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No authorized devices
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const status = getDeviceStatus(device);
                  const isCurrentDevice = device.device_fingerprint === currentDeviceFingerprint;
                  
                  return (
                    <TableRow key={device.id} className={isCurrentDevice ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.device_type)}
                          <span className="font-medium">
                            {device.device_name || 'Unknown Device'}
                          </span>
                          {isCurrentDevice && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {device.device_type || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {device.device_fingerprint.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {device.last_used_at
                          ? new Date(device.last_used_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {device.expires_at
                          ? new Date(device.expires_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {device.is_trusted && !isCurrentDevice && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {isCurrentDevice && device.is_trusted && (
                          <Badge variant="outline" className="bg-muted">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
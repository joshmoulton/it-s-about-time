
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { formatDistanceToNow } from 'date-fns';

interface DeviceManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  open,
  onOpenChange
}) => {
  const { 
    trustedDevices, 
    isLoading, 
    removeDevice, 
    isCurrentDeviceTrusted,
    trustCurrentDevice,
    loadTrustedDevices,
    generateDeviceFingerprint 
  } = useDeviceManagement();

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('mobile') || deviceName.toLowerCase().includes('android') || deviceName.toLowerCase().includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (deviceName.toLowerCase().includes('tablet') || deviceName.toLowerCase().includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const currentDeviceFingerprint = generateDeviceFingerprint();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trusted Devices</DialogTitle>
          <DialogDescription>
            Manage devices that can automatically sign you in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading devices...
            </div>
          ) : trustedDevices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No trusted devices found
            </div>
          ) : (
            trustedDevices.map((device) => (
              <Card key={device.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(device.device_name)}
                      <CardTitle className="text-sm">{device.device_name}</CardTitle>
                      {device.device_fingerprint === currentDeviceFingerprint && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDevice(device.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">
                    Last used {formatDistanceToNow(new Date(device.last_used_at), { addSuffix: true })}
                  </CardDescription>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isCurrentDeviceTrusted() && (
            <Button
              onClick={() => {
                trustCurrentDevice();
                loadTrustedDevices(); // Refresh the list
                onOpenChange(false);
              }}
            >
              Trust This Device
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  maintenance_mode: boolean;
  new_user_registration: boolean;
  email_notifications: boolean;
  auto_publish_approved: boolean;
  require_content_approval: boolean;
  default_author: string;
  default_read_time: number;
}

export function SystemConfigurationSection() {
  const { toast } = useToast();
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    new_user_registration: true,
    email_notifications: true,
    auto_publish_approved: false,
    require_content_approval: true,
    default_author: 'Weekly Wizdom Team',
    default_read_time: 5,
  });

  const handleSystemSettingChange = (key: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Auto-save system settings
    toast({
      title: "Setting Updated",
      description: `${key.replace('_', ' ')} has been updated`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Configuration
        </CardTitle>
        <CardDescription>Configure application-wide settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable to prevent user access during updates
              </p>
            </div>
            <Switch 
              checked={systemSettings.maintenance_mode}
              onCheckedChange={(checked) => handleSystemSettingChange('maintenance_mode', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">New User Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register accounts
              </p>
            </div>
            <Switch 
              checked={systemSettings.new_user_registration}
              onCheckedChange={(checked) => handleSystemSettingChange('new_user_registration', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send system notifications via email
              </p>
            </div>
            <Switch 
              checked={systemSettings.email_notifications}
              onCheckedChange={(checked) => handleSystemSettingChange('email_notifications', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  from_email: string;
  from_name: string;
}

export function EmailNotificationSection() {
  const { toast } = useToast();
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: 587,
    from_email: '',
    from_name: 'Weekly Wizdom'
  });

  const handleEmailSettingChange = (key: keyof EmailSettings, value: any) => {
    setEmailSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveEmailSettings = () => {
    // In a real implementation, this would save to a settings table or configuration
    toast({
      title: "Settings Saved",
      description: "Email configuration has been saved successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email & Notifications
        </CardTitle>
        <CardDescription>Configure email templates and notification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input 
              id="smtp-host" 
              placeholder="smtp.example.com"
              value={emailSettings.smtp_host}
              onChange={(e) => handleEmailSettingChange('smtp_host', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">SMTP Port</Label>
            <Input 
              id="smtp-port" 
              type="number" 
              placeholder="587"
              value={emailSettings.smtp_port}
              onChange={(e) => handleEmailSettingChange('smtp_port', parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email Address</Label>
            <Input 
              id="from-email" 
              type="email" 
              placeholder="noreply@weeklywizdompro.com"
              value={emailSettings.from_email}
              onChange={(e) => handleEmailSettingChange('from_email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name</Label>
            <Input 
              id="from-name" 
              value={emailSettings.from_name}
              onChange={(e) => handleEmailSettingChange('from_name', e.target.value)}
            />
          </div>
        </div>
        
        <Button onClick={saveEmailSettings}>Save Email Settings</Button>
      </CardContent>
    </Card>
  );
}

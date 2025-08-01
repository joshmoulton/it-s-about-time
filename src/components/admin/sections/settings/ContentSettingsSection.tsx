
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentSettings {
  auto_publish_approved: boolean;
  require_content_approval: boolean;
  default_author: string;
  default_read_time: number;
}

export function ContentSettingsSection() {
  const { toast } = useToast();
  const [contentSettings, setContentSettings] = useState<ContentSettings>({
    auto_publish_approved: false,
    require_content_approval: true,
    default_author: 'Weekly Wizdom Team',
    default_read_time: 5,
  });

  const handleContentSettingChange = (key: keyof ContentSettings, value: any) => {
    setContentSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: "Setting Updated",
      description: `${key.replace('_', ' ')} has been updated`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Content Settings
        </CardTitle>
        <CardDescription>Configure content creation and publishing settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default-author">Default Author Name</Label>
            <Input 
              id="default-author" 
              value={contentSettings.default_author}
              onChange={(e) => handleContentSettingChange('default_author', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-read-time">Default Read Time (minutes)</Label>
            <Input 
              id="default-read-time" 
              type="number" 
              value={contentSettings.default_read_time}
              onChange={(e) => handleContentSettingChange('default_read_time', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto-publish Approved Content</Label>
              <p className="text-sm text-muted-foreground">
                Automatically publish content after admin approval
              </p>
            </div>
            <Switch 
              checked={contentSettings.auto_publish_approved}
              onCheckedChange={(checked) => handleContentSettingChange('auto_publish_approved', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Require Content Approval</Label>
              <p className="text-sm text-muted-foreground">
                All content requires admin approval before publishing
              </p>
            </div>
            <Switch 
              checked={contentSettings.require_content_approval}
              onCheckedChange={(checked) => handleContentSettingChange('require_content_approval', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

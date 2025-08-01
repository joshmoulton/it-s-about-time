
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw, Smartphone, Monitor, Eye, EyeOff } from 'lucide-react';
import { DashboardPreferences, WidgetPreferences } from '@/hooks/useDashboardPersonalization';

interface DashboardPersonalizationPanelProps {
  preferences: DashboardPreferences;
  onPreferencesChange: (updates: Partial<DashboardPreferences>) => void;
  onWidgetPreferenceChange: (widgetId: string, updates: Partial<WidgetPreferences>) => void;
  onResetToDefaults: () => void;
  mostEngagedWidgets: Array<{ widgetId: string; viewTime: number; interactions: number }>;
}

export function DashboardPersonalizationPanel({
  preferences,
  onPreferencesChange,
  onWidgetPreferenceChange,
  onResetToDefaults,
  mostEngagedWidgets
}: DashboardPersonalizationPanelProps) {
  const getWidgetName = (widgetId: string) => {
    const names: Record<string, string> = {
      'chat-highlights': 'Chat Highlights',
      'sentiment-tracker': 'Sentiment Tracker',
      'live-chat': 'Live Chat',
      'newsletter': 'Newsletter',
      'edge': 'Edge',
      'alerts': 'Alerts',
      'trades': 'Trades'
    };
    return names[widgetId] || widgetId;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="layout-select">Layout Style</Label>
            <Select 
              value={preferences.layout} 
              onValueChange={(value: 'default' | 'compact' | 'expanded') => 
                onPreferencesChange({ layout: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="expanded">Expanded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="mobile-optimized" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Optimized
            </Label>
            <Switch
              id="mobile-optimized"
              checked={preferences.mobileOptimized}
              onCheckedChange={(mobileOptimized) => onPreferencesChange({ mobileOptimized })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Widget Management */}
      <Card>
        <CardHeader>
          <CardTitle>Widget Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {preferences.widgets.map((widget) => (
              <div key={widget.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {widget.visible ? 
                    <Eye className="h-4 w-4 text-green-600" /> : 
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  }
                  <span className="font-medium">{getWidgetName(widget.id)}</span>
                  <Badge variant="outline" className="text-xs">
                    {widget.size}
                  </Badge>
                </div>
                <Switch
                  checked={widget.visible}
                  onCheckedChange={(visible) => onWidgetPreferenceChange(widget.id, { visible })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Insights */}
      {mostEngagedWidgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Most Used Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mostEngagedWidgets.slice(0, 3).map((widget, index) => (
                <div key={widget.widgetId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="font-medium">{getWidgetName(widget.widgetId)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(widget.viewTime)} • {widget.interactions} interactions
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Settings */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            onClick={onResetToDefaults}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

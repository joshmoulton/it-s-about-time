import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TestTube, X } from 'lucide-react';
import { useTierOverride, SubscriptionTier } from '@/hooks/useTierOverride';

export function TierTestingSection() {
  const { currentOverride, isLoading, setTierOverride, clearTierOverride, isEnabled } = useTierOverride();

  if (!isEnabled) {
    return null;
  }

  const handleTierChange = (tier: SubscriptionTier) => {
    setTierOverride(tier);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Tier Testing
            </CardTitle>
            <CardDescription>
              Test different user experiences by overriding your subscription tier
            </CardDescription>
          </div>
          {currentOverride && (
            <Badge variant="secondary" className="gap-2">
              Testing as {currentOverride}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearTierOverride}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Test as Tier
              </label>
              <Select onValueChange={handleTierChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tier to test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Tier</SelectItem>
                  <SelectItem value="paid">Paid Tier</SelectItem>
                  <SelectItem value="premium">Premium Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={clearTierOverride}
                variant="outline"
                disabled={!currentOverride || isLoading}
                className="w-full"
              >
                Reset to Default
              </Button>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Select a tier to test the user experience for that subscription level</li>
              <li>• Your access is temporarily limited to what that tier can see</li>
              <li>• Admin panels and functions remain fully accessible</li>
              <li>• Use "Reset to Default" to return to full super admin access</li>
              <li>• Changes apply immediately and persist across page refreshes</li>
            </ul>
          </div>

          {currentOverride && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Active Override:</strong> You are currently experiencing the app as a <strong>{currentOverride}</strong> tier user.
                Content and features are filtered accordingly.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
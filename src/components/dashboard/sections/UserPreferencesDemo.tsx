// Demo component to show user preferences sync in action
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { Loader2, Cloud, HardDrive, User, Settings } from 'lucide-react';

export const UserPreferencesDemo = () => {
  const { currentUser } = useEnhancedAuth();
  const {
    isLoading,
    tradingProfile,
    uiSettings,
    notificationSettings,
    updateTradingProfile,
    updateUISettings,
    syncStatus
  } = useUserPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Preferences
          </CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              User Preferences System
            </span>
            <Badge variant={syncStatus === 'synced' ? 'default' : 'secondary'}>
              {syncStatus === 'synced' ? (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
                  Synced to Account
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3 mr-1" />
                  Local Storage Only
                </>
              )}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your preferences are automatically saved locally and {currentUser ? 'synced to your account' : 'will sync when you sign in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">User Status</h3>
              <p className="text-sm text-muted-foreground">
                {currentUser ? `${currentUser.email}` : 'Not signed in'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Local Storage</h3>
              <p className="text-sm text-muted-foreground">
                Immediate access
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Cloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Cloud Sync</h3>
              <p className="text-sm text-muted-foreground">
                {currentUser ? 'Active' : 'Sign in to enable'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Profile</CardTitle>
          <CardDescription>Your risk preferences and trading style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Risk Tolerance:</span>
              <Badge variant="secondary" className="capitalize">
                {tradingProfile?.riskTolerance}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Experience Level:</span>
              <Badge variant="secondary" className="capitalize">
                {tradingProfile?.tradingExperience}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Max Position Size:</span>
              <Badge variant="secondary">
                {tradingProfile?.maxPositionSize}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Trading Style:</span>
              <Badge variant="secondary" className="capitalize">
                {tradingProfile?.tradingStyle}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateTradingProfile({ 
                riskTolerance: tradingProfile?.riskTolerance === 'low' ? 'medium' : 'low' 
              })}
            >
              Toggle Risk Level (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* UI Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>UI Settings</CardTitle>
          <CardDescription>Your interface preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Theme:</span>
              <Badge variant="secondary" className="capitalize">
                {uiSettings?.theme}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Density:</span>
              <Badge variant="secondary" className="capitalize">
                {uiSettings?.density}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sidebar:</span>
              <Badge variant="secondary">
                {uiSettings?.sidebarCollapsed ? 'Collapsed' : 'Expanded'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateUISettings({ 
                theme: uiSettings?.theme === 'dark' ? 'light' : 'dark' 
              })}
            >
              Toggle Theme (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <p className="font-medium">Local Storage First</p>
                <p className="text-muted-foreground">All preferences are immediately saved to your browser's local storage for instant access</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <p className="font-medium">Database Sync (When Authenticated)</p>
                <p className="text-muted-foreground">If you're signed in, changes are automatically synced to your account in the background</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <p className="font-medium">Cross-Device Access</p>
                <p className="text-muted-foreground">When you sign in on another device, your preferences are restored from the database</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</div>
              <div>
                <p className="font-medium">Privacy & Performance</p>
                <p className="text-muted-foreground">Data stays in your browser for privacy, with optional cloud sync for convenience</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
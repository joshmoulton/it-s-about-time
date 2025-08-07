import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ExternalLink, Lock, AlertTriangle } from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { PasswordChangeSection } from './PasswordChangeSection';
export function SecuritySettingsSection() {
  const {
    currentUser
  } = useEnhancedAuth();
  const isWhopUser = currentUser?.user_type === 'whop_user';
  return <div className="space-y-6">
      {/* Account Security Overview */}
      <Card className="border border-brand-navy/20 bg-brand-navy/5 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {isWhopUser ? <Shield className="h-5 w-5 text-green-600" /> : <Lock className="h-5 w-5 text-brand-navy" />}
              </div>
              <div>
                <p className="font-medium">
                  {isWhopUser ? 'Whop Authentication' : 'Email Authentication'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isWhopUser ? 'Your account is secured through Whop\'s authentication system' : 'Your account uses email and password authentication'}
                </p>
              </div>
            </div>
            <Badge variant={isWhopUser ? 'default' : 'secondary'}>
              {isWhopUser ? 'Premium Security' : 'Standard'}
            </Badge>
          </div>

          {isWhopUser && <div className="p-4 bg-brand-navy/5 dark:bg-brand-navy/10 border border-brand-navy/20 dark:border-brand-navy/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-brand-navy flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-brand-navy dark:text-brand-navy-light">
                    Whop Account Management
                  </p>
                  <p className="text-sm text-brand-navy/80 dark:text-brand-navy-light/80 mt-1">
                    As a premium subscriber, your account is managed through Whop. 
                    To change your password, update billing, or manage security settings, 
                    please visit your Whop account dashboard.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 border-brand-navy/30 text-brand-navy hover:bg-brand-navy/10 dark:border-brand-navy/50 dark:text-brand-navy-light dark:hover:bg-brand-navy/20" asChild>
                    <a href="https://whop.com/account" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage on Whop
                    </a>
                  </Button>
                </div>
              </div>
            </div>}

          {!isWhopUser}
        </CardContent>
      </Card>

      {/* Password Settings - Only for non-Whop users */}
      {!isWhopUser && <PasswordChangeSection />}

    </div>;
}
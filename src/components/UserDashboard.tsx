
import React from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Mail, Calendar, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const UserDashboard = () => {
  const { subscriber, logout } = useEnhancedAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'paid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getTierIcon = (tier: string) => {
    if (tier === 'premium') return <Crown className="h-4 w-4" />;
    return null;
  };

  if (!subscriber) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Subscription</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Your Weekly Wizdom subscription details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{subscriber.email}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Member since {new Date(subscriber.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className={getTierColor(subscriber.subscription_tier)}>
            {getTierIcon(subscriber.subscription_tier)}
            <span className="capitalize">{subscriber.subscription_tier} Subscriber</span>
          </Badge>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Status: <span className="capitalize font-medium">{subscriber.status}</span>
          </p>
          
          {subscriber.subscription_tier === 'free' && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Upgrade for premium content and exclusive features
              </p>
              <Button size="sm" className="w-full">
                <a 
                  href="https://weekwiz.beehiiv.com/upgrade" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white"
                >
                  Upgrade Subscription
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDashboard;

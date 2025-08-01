import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, ExternalLink, CreditCard, Calendar } from 'lucide-react';
import { Subscriber } from '@/types/auth';

interface SubscriptionManagementProps {
  subscriber: Subscriber;
}

export function SubscriptionManagement({ subscriber }: SubscriptionManagementProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'paid': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'premium':
        return [
          'All paid features',
          'Priority support',
          'Advanced analytics',
          'Custom integrations',
          'Beta access to new features'
        ];
      case 'paid':
        return [
          'All free features',
          'Advanced content',
          'Email support',
          'Monthly reports',
          'Community access'
        ];
      default:
        return [
          'Basic newsletter',
          'Limited content access',
          'Community discussions'
        ];
    }
  };

  const handleManageSubscription = () => {
    // Redirect to Whop help page for billing and subscriptions
    window.open('https://help.whop.com/en/collections/11258983-billing-subscriptions', '_blank');
  };

  const handleUpgrade = () => {
    // Redirect to Beehiiv upgrade page
    window.open('https://weekwiz.beehiiv.com/upgrade', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscription</CardTitle>
        <CardDescription>
          Manage your subscription through Whop
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="font-medium">Current Plan</p>
            <Badge className={`mt-2 ${getTierColor(subscriber.subscription_tier)}`}>
              {subscriber.subscription_tier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
              <span className="capitalize">{subscriber.subscription_tier}</span>
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Your Benefits:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {getTierBenefits(subscriber.subscription_tier).map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          {subscriber.subscription_tier !== 'premium' && (
            <Button onClick={handleUpgrade}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
          <Button variant="outline" onClick={handleManageSubscription}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

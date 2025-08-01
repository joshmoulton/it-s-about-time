import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';

interface PaywallCardProps {
  requiredTier: 'paid' | 'premium';
  currentTier: 'free' | 'paid' | 'premium';
  title: string;
  excerpt?: string;
  onUpgrade?: () => void;
}

export function PaywallCard({ requiredTier, currentTier, title, excerpt, onUpgrade }: PaywallCardProps) {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="h-4 w-4" />;
      case 'paid':
        return <Zap className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'paid':
        return 'bg-gradient-to-r from-blue-500 to-purple-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-10 ${getTierColor(requiredTier)}`} />
      <CardHeader className="text-center relative">
        <div className="mx-auto mb-4 p-4 rounded-full bg-muted w-fit">
          {getTierIcon(requiredTier)}
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <Badge variant="secondary" className="mx-auto">
          {getTierIcon(requiredTier)}
          <span className="ml-1 capitalize">{requiredTier} Content</span>
        </Badge>
      </CardHeader>
      
      <CardContent className="text-center space-y-4 relative">
        {excerpt && (
          <p className="text-muted-foreground text-sm">
            {excerpt.length > 120 ? `${excerpt.substring(0, 120)}...` : excerpt}
          </p>
        )}
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm mb-3">
            This content requires a <span className="font-semibold capitalize">{requiredTier}</span> subscription to access.
          </p>
          {currentTier === 'free' && (
            <p className="text-xs text-muted-foreground mb-4">
              Upgrade your subscription to unlock premium market insights and analysis.
            </p>
          )}
          {currentTier === 'paid' && requiredTier === 'premium' && (
            <p className="text-xs text-muted-foreground mb-4">
              Upgrade to Premium for exclusive high-value content and advanced features.
            </p>
          )}
        </div>

        <Button 
          onClick={onUpgrade}
          className="w-full"
          variant={requiredTier === 'premium' ? 'default' : 'outline'}
        >
          {getTierIcon(requiredTier)}
          <span className="ml-2">
            Upgrade to {requiredTier === 'premium' ? 'Premium' : 'Paid'}
          </span>
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Questions about subscriptions? Contact support for help.
        </p>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface Subscriber {
  subscription_tier: 'free' | 'paid' | 'premium';
}

interface TierBadgeProps {
  subscriber: Subscriber;
}

export function TierBadge({ subscriber }: TierBadgeProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-gradient-to-r from-brand-warning/20 to-yellow-500/20 text-brand-warning border-brand-warning/30 dark:text-yellow-400 dark:border-yellow-400/30';
      case 'paid': return 'bg-gradient-to-r from-brand-primary/20 to-blue-500/20 text-brand-primary border-brand-primary/30 dark:text-blue-400 dark:border-blue-400/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'paid':
      case 'premium':
        return 'Premium';
      case 'free':
        return 'Free';
      default:
        return tier.charAt(0).toUpperCase() + tier.slice(1);
    }
  };

  const tierLevel = subscriber?.subscription_tier || 'free';
  const isPremiumTier = tierLevel === 'paid' || tierLevel === 'premium';

  return (
    <Badge className={`${getTierColor(tierLevel)} px-3 py-1.5 text-sm font-medium backdrop-blur-sm border`} data-tour="subscription-tier">
      {isPremiumTier && <Crown className="h-4 w-4 mr-1.5" />}
      <span>{getTierDisplayName(tierLevel)}</span>
    </Badge>
  );
}

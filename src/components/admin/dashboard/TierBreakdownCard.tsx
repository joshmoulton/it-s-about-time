
import React from 'react';
import { Users, Crown, Star } from 'lucide-react';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { useOptimizedAdminStats } from '@/hooks/useOptimizedAdminStats';

export function TierBreakdownCard() {
  const { data: stats } = useOptimizedAdminStats();

  const tiers = [
    {
      name: 'Free',
      count: stats?.usersByTier?.free || 0,
      icon: Users,
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-500/20'
    },
    {
      name: 'Paid',
      count: stats?.usersByTier?.paid || 0,
      icon: Star,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500/20'
    },
    {
      name: 'Premium',
      count: stats?.usersByTier?.premium || 0,
      icon: Crown,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-500/20'
    }
  ];

  const total = tiers.reduce((sum, tier) => sum + tier.count, 0);

  return (
    <EnhancedCard variant="glass" className="h-full">
      <EnhancedCardHeader>
        <EnhancedCardTitle className="text-white">User Tiers</EnhancedCardTitle>
      </EnhancedCardHeader>
      <EnhancedCardContent className="space-y-4">
        {tiers.map((tier) => {
          const percentage = total > 0 ? (tier.count / total) * 100 : 0;
          const Icon = tier.icon;
          
          return (
            <div key={tier.name} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{tier.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{tier.count.toLocaleString()}</div>
                  <div className="text-white/60 text-xs">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${tier.color} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </EnhancedCardContent>
    </EnhancedCard>
  );
}


import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Zap, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscriber {
  subscription_tier: 'free' | 'paid' | 'premium';
}

interface TierUpgradePromptProps {
  subscriber: Subscriber;
  feature: string;
  className?: string;
}

export function TierUpgradePrompt({ subscriber, feature, className = '' }: TierUpgradePromptProps) {
  const navigate = useNavigate();
  
  const getUpgradeConfig = () => {
    if (subscriber.subscription_tier === 'free') {
      return {
        title: 'Unlock Premium Features',
        description: `${feature} is available for paid subscribers`,
        icon: Star,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
      };
    } else if (subscriber.subscription_tier === 'paid') {
      return {
        title: 'Upgrade to Premium',
        description: `${feature} requires premium subscription`,
        icon: Crown,
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20'
      };
    }
    return null;
  };

  const config = getUpgradeConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border ${className}`}>
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className="h-8 w-8 text-current" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        <p className="text-muted-foreground mb-4 text-sm">{config.description}</p>
        
        <Button 
          onClick={() => navigate('/pricing?open=1')}
          className={`bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity`}
        >
          Upgrade Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Plan {
  title: string;
  price: string;
  period: string;
  productId: string;
  popular?: boolean;
  originalPrice?: string;
  savings?: string;
  description: string;
}

interface PricingCardProps {
  plan: Plan;
  onCheckout: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ plan, onCheckout }) => {
  return (
    <div className={`relative p-4 sm:p-6 rounded-xl border transition-all duration-200 hover:shadow-lg touch-manipulation ${
      plan.popular 
        ? 'ring-2 ring-primary border-primary shadow-lg bg-primary/5' 
        : 'border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10'
    }`}>
      {plan.popular && (
        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
            Most Popular
          </Badge>
        </div>
      )}
      
      <div className="text-center">
        <h4 className="text-base sm:text-lg font-bold mb-2">{plan.title}</h4>
        <div className="mb-3 sm:mb-4">
          <span className="text-2xl sm:text-3xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground text-sm sm:text-base">{plan.period}</span>
        </div>
        
        {plan.originalPrice && (
          <div className="mb-3 sm:mb-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-muted-foreground line-through text-xs sm:text-sm">{plan.originalPrice}</span>
            <span className="text-green-600 font-semibold text-xs sm:text-sm">{plan.savings}</span>
          </div>
        )}
        
        <Button 
          onClick={onCheckout} 
          className="w-full min-h-[44px] text-sm sm:text-base" 
          variant="default"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
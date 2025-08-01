import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { WhopProduct } from '@/hooks/useWhopProducts';

interface WhopProductCardProps {
  product: WhopProduct;
  onPurchase: (productId: string) => void;
  formatPrice: (priceCents: number, currency: string) => string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  loading?: boolean;
  className?: string;
}

export const WhopProductCard: React.FC<WhopProductCardProps> = ({
  product,
  onPurchase,
  formatPrice,
  isPopular = false,
  isCurrentPlan = false,
  loading = false,
  className = "",
}) => {
  const features = product.metadata?.features || [
    'Access to premium content',
    'Weekly trading signals',
    'Community access',
    'Email support'
  ];

  const isFree = product.price_cents === 0;
  const isPremium = product.price_cents >= 5000;

  const getCardIcon = () => {
    if (isPremium) return <Crown className="h-5 w-5 text-brand-warning" />;
    if (!isFree) return <Zap className="h-5 w-5 text-brand-primary" />;
    return null;
  };

  const getGradientClass = () => {
    if (isPremium) return 'from-brand-warning/20 to-brand-error/20';
    if (!isFree) return 'from-brand-primary/20 to-brand-primary/30';
    return 'from-muted/20 to-muted/30';
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl border-white/10 bg-brand-secondary/20 backdrop-blur-sm ${
      isPopular ? 'ring-2 ring-brand-primary scale-105 shadow-brand-primary/25' : ''
    } ${isCurrentPlan ? 'ring-2 ring-brand-success' : ''} ${className}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass()} opacity-50`} />
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-brand text-white text-center py-2 text-sm font-medium z-20">
          Most Popular
        </div>
      )}
      
      <CardHeader className={`relative z-10 text-center space-y-4 ${isPopular ? 'pt-8' : ''}`}>
        <div className="flex items-center justify-center gap-2">
          {getCardIcon()}
          <CardTitle className="text-2xl font-bold text-white">{product.title}</CardTitle>
        </div>
        
        <div className="space-y-2">
          <div className="text-4xl font-bold text-gradient-brand">
            {isFree ? 'Free' : formatPrice(product.price_cents, product.currency)}
          </div>
          {!isFree && (
            <div className="text-sm text-white/60">
              per month
            </div>
          )}
        </div>
        
        {product.description && (
          <p className="text-white/70 text-sm">{product.description}</p>
        )}
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        <div className="space-y-3">
          {features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-4 h-4 bg-brand-success rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-white/90">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={() => onPurchase(product.whop_product_id)}
          disabled={loading || isCurrentPlan}
          className={`w-full h-12 font-medium transition-all duration-300 ${
            isPremium 
              ? 'bg-gradient-to-r from-brand-warning to-brand-error hover:from-brand-warning/90 hover:to-brand-error/90 shadow-brand-warning/25' 
              : 'bg-gradient-brand hover:shadow-brand-primary/50'
          } text-white border-0 hover:scale-105`}
        >
          {loading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isFree ? (
            'Get Started'
          ) : (
            'Upgrade Now'
          )}
        </Button>

        {isCurrentPlan && (
          <Badge className="w-full justify-center bg-brand-success text-white border-0">
            Active Subscription
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
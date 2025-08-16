import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, X } from 'lucide-react';
import { PaymentToggle } from './PaymentToggle';
import { PricingCard } from './PricingCard';
import { PremiumFeatures } from './PremiumFeatures';
import { WhopEmbeddedCheckout } from '@/components/upgrade/WhopEmbeddedCheckout';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'sonner';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const cardPlans = [{
  title: 'Monthly',
  price: '$69.99',
  period: '/month',
  productId: '4QxYd6NKaDkmMJCte9-faeD-zuxA-OjT2-0ssruHW5aST8',
  popular: false,
  description: 'Perfect for getting started'
}, {
  title: 'Yearly',
  price: '$750',
  period: '/year',
  originalPrice: '$839.88',
  savings: 'Save $89.88',
  productId: 'CCk7osaf7UIrzlOxj-6ULU-XjHr-7dPx-u9IUV6sHa21J',
  popular: true,
  description: 'Best value for serious investors'
}];

const cryptoPlans = [{
  title: 'Monthly',
  price: '$69.99',
  period: '/month',
  productId: '4ARbsoAlUZHxlkJnQl-ZxjG-iOAB-Ecqr-d4rNMoLB5psd',
  description: 'Pay with USDC'
}, {
  title: 'Quarterly',
  price: '$200',
  period: '/3 months',
  originalPrice: '$209.97',
  savings: 'Save $9.97',
  productId: '65iz5KJH6skRurRsJz-cvdo-dDtr-MxFC-uXg3bSeeWr1f',
  description: 'Short-term commitment'
}, {
  title: 'Yearly',
  price: '$750',
  period: '/year',
  originalPrice: '$839.88',
  savings: 'Save $89.88',
  productId: 'OTpcseZT8NRAehyIV-cyit-InB7-7bz5-nvlLpY1GTbPf',
  popular: true,
  description: 'Maximum savings'
}];

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { refreshCurrentUser } = useEnhancedAuth();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  
  // Debug logging
  useEffect(() => {
    console.log('PricingModal rendered, open:', open);
  }, [open]);
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    productId: string | null;
    productTitle?: string;
  }>({
    open: false,
    productId: null,
  });

  const handleCheckout = (productId: string, planTitle: string) => {
    console.log('Checkout initiated for:', planTitle, productId);
    onOpenChange(false);
    setTimeout(() => setCheckoutModal({ open: true, productId, productTitle: planTitle }), 100);
  };

  const handleCheckoutSuccess = async () => {
    await refreshCurrentUser();
    toast.success('Welcome to Premium! Your access has been upgraded.');
  };

  const currentPlans = paymentMethod === 'card' ? cardPlans : cryptoPlans;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden flex flex-col mx-auto my-auto bg-gradient-to-br from-background via-background to-muted/20 border border-border/50 shadow-2xl rounded-3xl backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/5 opacity-80 rounded-3xl"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="p-6 sm:p-8 lg:p-10 flex-shrink-0 relative">
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg backdrop-blur-sm"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
              <DialogHeader className="text-center space-y-4 sm:space-y-6 pr-12 sm:pr-16">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-primary/20">
                    <Sparkles className="h-6 w-6 text-primary drop-shadow-sm" />
                  </div>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Upgrade to Premium
                </DialogTitle>
                <DialogDescription className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Choose your premium subscription plan and unlock all features with exclusive trading signals
                </DialogDescription>
                <div className="pt-4">
                  <PaymentToggle 
                    paymentMethod={paymentMethod} 
                    onPaymentMethodChange={setPaymentMethod} 
                  />
                </div>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 py-4">
                {currentPlans.map((plan, index) => (
                  <div key={index} className={`${plan.popular ? 'lg:scale-105 lg:z-10' : ''} transition-all duration-300`}>
                    <div className={`h-full ${plan.popular ? 'shadow-2xl shadow-primary/20' : 'shadow-lg'} rounded-2xl border ${plan.popular ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5' : 'border-border bg-card/50'} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}>
                      <PricingCard
                        plan={plan}
                        onCheckout={() => handleCheckout(plan.productId, plan.title)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 sm:mt-12 pb-8 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm border border-border/30 shadow-lg">
                <PremiumFeatures />
              </div>
            </div>

            <div className="flex-shrink-0 p-6 sm:p-8 lg:p-10 pt-4 sm:pt-6 bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 border-t border-border/50 backdrop-blur-sm">
              <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed font-medium">
                {paymentMethod === 'card' ? '🔒 Secure credit card processing' : '💰 Pay with USDC cryptocurrency'} • ⚡ Start today • 🔄 Cancel anytime
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WhopEmbeddedCheckout
        open={checkoutModal.open}
        onOpenChange={(open) => setCheckoutModal(prev => ({ ...prev, open }))}
        productId={checkoutModal.productId}
        productTitle={checkoutModal.productTitle}
        onSuccess={handleCheckoutSuccess}
      />
    </>
  );
};
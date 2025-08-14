import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
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
        <DialogContent className="w-full max-w-[400px] sm:max-w-[480px] lg:max-w-[520px] max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0">
          <div className="p-4 sm:p-6 flex-shrink-0">
            <DialogHeader className="text-center space-y-2 sm:space-y-3">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Upgrade to Premium
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Choose your premium subscription plan and unlock all features
              </DialogDescription>
              <div className="pt-2">
                <PaymentToggle 
                  paymentMethod={paymentMethod} 
                  onPaymentMethodChange={setPaymentMethod} 
                />
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-3 sm:space-y-4 py-2">
              {currentPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  plan={plan}
                  onCheckout={() => handleCheckout(plan.productId, plan.title)}
                />
              ))}
            </div>

            <div className="mt-4 sm:mt-6">
              <PremiumFeatures />
            </div>
          </div>

          <div className="flex-shrink-0 p-4 sm:p-6 pt-2 sm:pt-3 bg-muted/30 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
              {paymentMethod === 'card' ? 'Secure credit card processing' : 'Pay with USDC cryptocurrency'} • Start today • Cancel anytime
            </p>
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
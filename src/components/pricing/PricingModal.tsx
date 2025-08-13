import React, { useState } from 'react';
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
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>
              Choose your premium subscription plan and unlock all features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <PaymentToggle 
              paymentMethod={paymentMethod} 
              onPaymentMethodChange={setPaymentMethod} 
            />

            <div className="space-y-4">
              {currentPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  plan={plan}
                  onCheckout={() => handleCheckout(plan.productId, plan.title)}
                />
              ))}
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {paymentMethod === 'card' ? 'Secure credit card processing' : 'Pay with USDC cryptocurrency'} • Start today • Cancel anytime
              </p>
            </div>

            <PremiumFeatures />
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
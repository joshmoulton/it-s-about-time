import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Bitcoin, X, Sparkles, MessageCircle } from 'lucide-react';
import { openWhopCheckout } from '@/utils/whopCheckoutUtils';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'sonner';
import { WhopEmbeddedCheckout } from '@/components/upgrade/WhopEmbeddedCheckout';

interface PremiumPricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumPricingModal: React.FC<PremiumPricingModalProps> = ({
  open,
  onOpenChange
}) => {
  const { refreshCurrentUser } = useEnhancedAuth();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', question: '' });
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    productId: string | null;
    productTitle?: string;
  }>({
    open: false,
    productId: null,
  });

  // Modal state management and performance optimization
  useEffect(() => {
    if (open) {
      console.log('PremiumPricingModal opened');
      
      // Add modal-open class to body to manage conflicting CSS
      document.body.classList.add('modal-open');
      
      // Disable problematic transforms on page elements
      const disableTransforms = () => {
        const problematicElements = document.querySelectorAll('main, .dashboard, .page, #__next, #root');
        problematicElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.setProperty('transform', 'none', 'important');
            el.style.setProperty('perspective', 'none', 'important');
            el.style.setProperty('filter', 'none', 'important');
          }
        });
      };
      
      disableTransforms();
      
      // Only add essential DNS preconnection without CORS issues
      const addPreconnect = (domain: string) => {
        if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = domain;
          document.head.appendChild(link);
        }
      };

      // Only preconnect to essential Whop domains
      addPreconnect('https://whop.com');
      
      return () => {
        // Cleanup: restore body classes and styles
        document.body.classList.remove('modal-open');
        const problematicElements = document.querySelectorAll('main, .dashboard, .page, #__next, #root');
        problematicElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.removeProperty('transform');
            el.style.removeProperty('perspective');
            el.style.removeProperty('filter');
          }
        });
      };
    }
  }, [open]);

  useEffect(() => {
    console.debug('[premium] PremiumPricingModal render, open=', open);
  }, [open]);


  const handleCheckout = (productId: string, planTitle: string) => {
    console.log('Checkout initiated for:', planTitle, productId);
    // Close pricing modal, then open embedded checkout (prevents stacked overlays)
    onOpenChange(false);
    setTimeout(() => setCheckoutModal({ open: true, productId, productTitle: planTitle }), 100);
  };

  const handleCheckoutSuccess = async () => {
    // Refresh user authentication state after successful purchase
    await refreshCurrentUser();
    toast.success('Welcome to Premium! Your access has been upgraded.');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
    setContactForm({ email: '', question: '' });
    setShowContactForm(false);
    toast.success('Thank you! We will get back to you soon.');
  };

  const premiumFeatures = [
    'Full Weekly Newsletter (No Previews)', 
    'Pro Recap & Education Emails', 
    'Exclusive Monthly Reports', 
    '24/7 Telegram Community Access', 
    'Real-Time Trade Alerts & Charts', 
    'Live Trading Workshops', 
    'Direct Access to Technical Analysts', 
    'VIP Notifications Dashboard (Never Miss a Move)'
  ];

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Upgrade to Premium
              </DialogTitle>
              <DialogDescription className="text-sm">
                Choose your premium subscription plan and unlock all features
              </DialogDescription>
            </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Pricing Plans Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Payment Method Toggle */}
              <div className="flex justify-center">
                <div className="bg-muted p-1 rounded-lg flex">
                  <button 
                    onClick={() => setPaymentMethod('card')} 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${paymentMethod === 'card' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    Credit Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('crypto')} 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${paymentMethod === 'crypto' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Bitcoin className="h-4 w-4 inline mr-2" />
                    Crypto
                  </button>
                </div>
              </div>

              {/* Pricing Cards - Responsive Grid */}
              <div className={`grid gap-4 lg:gap-6 ${paymentMethod === 'card' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {(paymentMethod === 'card' ? cardPlans : cryptoPlans).map((plan, index) => (
                  <div key={index} className={`relative p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${plan.popular ? 'ring-2 ring-primary border-primary shadow-lg scale-105' : 'border hover:border-primary/50'}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h4 className="text-lg font-bold mb-2">{plan.title}</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/{plan.period.replace('/', '')}</span>
                      </div>
                      
                      {plan.originalPrice && (
                        <div className="mb-4 flex items-center justify-center gap-2">
                          <span className="text-muted-foreground line-through text-sm">{plan.originalPrice}</span>
                          <span className="text-green-600 font-semibold text-sm">{plan.savings}</span>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => handleCheckout(plan.productId, plan.title)} 
                        className="w-full" 
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Info */}
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {paymentMethod === 'card' ? 'Secure credit card processing' : 'Pay with USDC cryptocurrency'} • Start today • Cancel anytime
                </p>
              </div>
            </div>

            {/* Features Section */}
            <div className="xl:col-span-1">
              <div className="bg-muted/30 rounded-lg p-6 h-full">
                <h3 className="font-semibold text-lg mb-4 text-center">Premium Features</h3>
                <div className="grid grid-cols-1 gap-3">
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Contact Form */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium mb-3 text-center">Have questions?</p>
                  {!showContactForm ? (
                    <Button 
                      onClick={() => setShowContactForm(true)}
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Us
                    </Button>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <input
                        type="email"
                        placeholder="Your email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-input rounded bg-background"
                        required
                      />
                      <textarea
                        placeholder="Your question"
                        value={contactForm.question}
                        onChange={(e) => setContactForm(prev => ({ ...prev, question: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-input rounded bg-background resize-none"
                        rows={3}
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">Send</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowContactForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
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

export default PremiumPricingModal;
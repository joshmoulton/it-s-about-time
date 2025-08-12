
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

  // Minimal setup when modal opens - avoid aggressive prefetching
  useEffect(() => {
    if (open) {
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
    }
  }, [open]);

  useEffect(() => {
    console.debug('[premium] PremiumPricingModal render, open=', open);
  }, [open]);


  const handleCheckout = (productId: string, planTitle: string) => {
    // Close pricing modal, then open embedded checkout (prevents stacked overlays)
    onOpenChange(false);
    setTimeout(() => setCheckoutModal({ open: true, productId, productTitle: planTitle }), 0);
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
    alert('Thank you! We will get back to you soon.');
  };

  const premiumFeatures = ['Full Weekly Newsletter (No Previews)', 'Pro Recap & Education Emails', 'Exclusive Monthly Reports', '24/7 Telegram Community Access', 'Real-Time Trade Alerts & Charts', 'Live Trading Workshops', 'Direct Access to Technical Analysts', 'VIP Notifications Dashboard (Never Miss a Move)'];

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
        <DialogContent className="fixed top-[2%] left-1/2 transform -translate-x-1/2 z-[10001] p-0 border-border bg-card overflow-hidden w-[95vw] sm:w-[95vw] max-w-6xl max-h-[96vh] sm:rounded-lg">
          <div className="h-full overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <DialogHeader className="sticky top-0 z-10 text-center pb-3 pt-4 px-4 sm:px-6 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border/50">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Sparkles className="h-10 w-10 text-brand-primary" />
                <div className="absolute inset-0 h-10 w-10 bg-brand-primary/20 rounded-full blur-xl"></div>
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-primary via-brand-primary to-brand-navy bg-clip-text text-transparent">
                Upgrade to Premium
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
              Choose your premium subscription plan to get actionable insights from crypto, equity, commodities and more every week. Trusted by 1,000s of serious investors.
            </DialogDescription>
          </DialogHeader>

            {/* Payment Method Toggle */}
            <div className="flex justify-center mb-6 px-6">
            <div className="bg-muted/50 backdrop-blur-sm rounded-full p-1.5 border border-border/50 shadow-lg">
              <div className="flex">
                <button 
                  onClick={() => setPaymentMethod('card')} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${paymentMethod === 'card' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                >
                  <CreditCard className="h-4 w-4" />
                  Credit Card
                </button>
                <button 
                  onClick={() => setPaymentMethod('crypto')} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${paymentMethod === 'crypto' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                >
                  <Bitcoin className="h-4 w-4" />
                  Crypto (USDC)
                </button>
              </div>
            </div>
          </div>

            {/* Pricing Plans */}
            <div className={`grid gap-4 mb-6 px-6 ${paymentMethod === 'card' ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'}`}>
            {(paymentMethod === 'card' ? cardPlans : cryptoPlans).map((plan, index) => (
              <div key={index} className={`group relative p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] border flex flex-col backdrop-blur-sm ${plan.popular ? 'bg-gradient-to-br from-brand-primary/5 via-background to-background border-brand-primary border-2 shadow-xl shadow-brand-primary/10' : 'bg-card/80 border-border hover:border-brand-primary/50 hover:shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary/80 text-white px-4 py-1.5 text-xs font-bold shadow-lg rounded-full border border-white/20">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                
                <div className="text-center flex-grow flex flex-col pt-2">
                  <h4 className="text-lg font-bold mb-2 text-foreground">{plan.title}</h4>
                  <p className="text-muted-foreground text-xs mb-4">{plan.description}</p>
                  
                  <div className="mb-6 flex-grow flex flex-col justify-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-lg">{plan.period}</span>
                    </div>
                    
                    {plan.originalPrice && (
                      <div className="flex items-center justify-center gap-3 mt-3">
                        <span className="text-muted-foreground line-through text-sm">{plan.originalPrice}</span>
                        <span className="text-brand-success font-semibold text-sm bg-brand-success/10 px-2 py-1 rounded-full">{plan.savings}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => handleCheckout(plan.productId, plan.title)} 
                    className={`w-full h-10 font-semibold transition-all duration-300 group-hover:scale-105 mt-auto ${plan.popular ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/25' : 'bg-background hover:bg-brand-primary hover:text-white text-foreground border-2 border-brand-primary/20 hover:border-brand-primary'}`} 
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Choose {plan.title}
                  </Button>
                </div>
              </div>
            ))}
          </div>

            {/* Payment Method Info */}
            <div className="text-center p-4 mx-6 bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl border border-border/50 mb-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-2">
              {paymentMethod === 'card' ? <CreditCard className="h-5 w-5 text-brand-primary" /> : <Bitcoin className="h-5 w-5 text-orange-500" />}
              <span className="text-foreground font-semibold">
                {paymentMethod === 'card' ? 'Credit Card Payment' : 'Crypto Payment (USDC)'}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-1">
              {paymentMethod === 'card' ? 'Secure payment processing with instant access to premium features' : 'Pay with USDC for the fastest and most secure payment method'}
            </p>
            <p className="text-muted-foreground/70 text-xs">
              Start your premium subscription today • Cancel anytime
            </p>
          </div>

            {/* Questions Section */}
            <div className="text-center mb-6 p-4 mx-6 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl border border-border/50 backdrop-blur-sm">
            <p className="text-foreground font-semibold text-sm mb-3">Have questions or concerns?</p>
            {!showContactForm ? (
              <Button 
                onClick={() => setShowContactForm(true)}
                variant="outline" 
                size="sm"
                className="border-brand-primary/20 hover:border-brand-primary hover:bg-brand-primary/5"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Us
              </Button>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 mt-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                  required
                />
                <textarea
                  placeholder="Your question or concern"
                  value={contactForm.question}
                  onChange={(e) => setContactForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground resize-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                  rows={3}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1 bg-brand-primary hover:bg-brand-primary/90">
                    Send Message
                  </Button>
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

            {/* Premium Features */}
            <div className="mb-4 p-6 mx-6 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-3">What's Included</h3>
              <div className="w-16 h-1 bg-gradient-to-r from-brand-primary to-brand-primary/60 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-background/80 border border-border/50 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-success/20 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="h-4 w-4 text-brand-success" />
                  </div>
                  <span className="text-foreground font-medium text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
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

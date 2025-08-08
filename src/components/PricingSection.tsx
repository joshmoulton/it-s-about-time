import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardTitle, EnhancedCardContent } from '@/components/ui/enhanced-card';
import { Check, X, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { SuccessModal } from '@/components/SuccessModal';

interface PricingTierProps {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  popular?: boolean;
  isFree?: boolean;
  onButtonClick: React.MouseEventHandler<HTMLButtonElement>;
}

const PricingTier: React.FC<PricingTierProps> = ({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = 'outline',
  popular = false,
  isFree = false,
  onButtonClick
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' });
  const { toast } = useToast();

  const handleFreeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setHasError(true);
      // Clear error after animation
      setTimeout(() => setHasError(false), 1000);
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setHasError(false);
    setLoading(true);

    try {
      // Call the custom send-magic-link edge function
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: { email: email.toLowerCase().trim() }
      });

      if (error || !data?.success) {
        const errorMessage = data?.error || error?.message || 'Failed to send access link';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        setIsSuccess(true);
        setEmail('');
        
        // Show appropriate success message based on user status
        if (data.is_new_user) {
          setSuccessMessage({
            title: "Welcome to Weekly Wizdom!",
            description: "We've created your free subscription and sent you an access link via email. Check your inbox to get started!"
          });
        } else {
          setSuccessMessage({
            title: "Access Link Sent!",
            description: "Check your email and click the link to sign in to your account."
          });
        }
        
        setShowSuccessModal(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {popular && (
        <div className="absolute -top-3 sm:-top-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-brand-primary px-4 sm:px-6 py-1 sm:py-2 rounded-full text-white text-xs sm:text-sm font-bold shadow-lg">
            <Sparkles className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            MOST POPULAR
          </div>
        </div>
      )}
      
      <EnhancedCard variant="glass" className={`group relative transition-all duration-300 sm:hover:scale-[1.02] sm:hover:shadow-xl h-full ${popular ? 'bg-card border-2 border-brand-primary shadow-2xl text-brand-primary sm:hover:ring-2 sm:hover:ring-brand-primary/20' : 'bg-card border-2 border-border sm:hover:shadow-lg'}`}>
        <EnhancedCardHeader className="text-center pb-6 relative z-10">
          <EnhancedCardTitle className={`font-montserrat text-2xl font-bold mb-4 ${popular ? 'text-foreground' : 'text-foreground'}`}>
            {title}
          </EnhancedCardTitle>
          <div className="mb-6">
            <span className={`font-montserrat text-4xl md:text-5xl font-bold ${popular ? 'text-brand-primary' : 'text-foreground'}`}>
              {price}
            </span>
            {period && <span className={`font-montserrat ml-2 text-lg ${popular ? 'text-foreground' : 'text-foreground'}`}>{period}</span>}
          </div>
          <p className={`font-montserrat text-base leading-relaxed ${popular ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            {description}
          </p>
        </EnhancedCardHeader>
        
        <EnhancedCardContent className="relative z-10">
          <div className={`space-y-4 ${popular ? 'mb-12' : 'mb-8'}`}>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                {feature.included ? (
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <X className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${popular ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
                )}
                <span className={`font-montserrat text-sm ${feature.included ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
          
          {isFree ? (
            <form onSubmit={handleFreeSignup} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email} 
                  onChange={e => {
                    setEmail(e.target.value);
                    setHasError(false);
                  }} 
                  className={`font-montserrat pl-10 h-12 bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 shadow-sm hover:shadow-md transition-all duration-300 ${hasError ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-2 border-brand-primary/30 focus:border-brand-primary focus:ring-brand-primary/20'}`} 
                  disabled={loading} 
                />
              </div>
              <Button 
                type="submit" 
                className={`w-full h-12 font-semibold border-2 transition-all duration-300 sm:hover:scale-105 sm:hover:translate-y-[-2px] touch-manipulation min-h-[44px] ${hasError ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed animate-[shake_0.5s_ease-in-out]' : isSuccess ? 'bg-[#06804D] text-white border-[#06804D] cursor-default' : 'bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-brand-primary'}`} 
                size="lg" 
                disabled={loading || isSuccess}
              >
                {loading ? 'Sending access link...' : isSuccess ? 'Success! Check your email' : buttonText}
              </Button>
            </form>
          ) : (
            <Button 
              type="button"
              className="w-full h-14 bg-brand-primary hover:bg-background hover:text-brand-primary text-white font-semibold border-2 border-brand-primary transition-all duration-300 sm:hover:scale-105 sm:hover:translate-y-[-2px] touch-manipulation min-h-[44px]" 
              size="lg" 
              onClick={onButtonClick}
            >
              {buttonText}
            </Button>
          )}

          {/* Success Modal */}
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title={successMessage.title}
            description={successMessage.description}
            autoCloseDelay={6000}
          />
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  );
};

interface PricingSectionProps {
  onAuthClick?: () => void;
  onOpenPremiumModal?: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onAuthClick, onOpenPremiumModal }) => {
  const { toast } = useToast();

  const pricingTiers = [{
    title: 'FREE',
    price: '$0',
    period: '/mo',
    description: 'Get Value without any Commitments',
    features: [{
      name: 'Weekly Newsletter *Preview*',
      included: true
    }, {
      name: 'Weekly Educational Emails',
      included: true
    }, {
      name: 'Basic Market Insights',
      included: true
    }, {
      name: 'Exclusive Monthly Reports',
      included: false
    }, {
      name: 'Telegram Community Access',
      included: false
    }, {
      name: 'Live Trading Workshops',
      included: false
    }, {
      name: 'Access to Technical Analysts',
      included: false
    }],
    buttonText: 'Get Started for Free',
    buttonVariant: 'outline' as const,
    isFree: true
  }, {
    title: 'PREMIUM',
    price: '$69.99',
    period: '/mo',
    description: 'Complete Access to All Tools, Content and the Community',
    features: [{
      name: 'Weekly Newsletter',
      included: true
    }, {
      name: '24/7 Telegram Community Access',
      included: true
    }, {
      name: 'Dashboard & Trade Tracker',
      included: true
    }, {
      name: 'Real-Time Trade Alerts & Notifications ',
      included: true
    }, {
      name: 'Direct Access to Technical Analysts',
      included: true
    }, {
      name: 'Live Trading Workshops',
      included: true
    }, {
      name: 'Analyst Portfolio Allocation Breakdowns',
      included: true
    }, {
      name: 'Weekly Market Round Up & Monthly Reports ',
      included: true
    }],
    buttonText: 'Choose Premium Plan',
    buttonVariant: 'default' as const,
    popular: true
  }];

const handlePremiumClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.debug('[premium] CTA clicked');
  try {
    toast({ title: 'Opening Premium…', description: 'Loading premium plans.', duration: 1500 });
  } catch {}
  onOpenPremiumModal?.();

  // 700ms later, verify the modal exists; if not, hard-fallback
  setTimeout(() => {
    const el = document.getElementById('premium-pricing-modal-content');
    const found = !!el;
    console.debug('[premium] modal content present?', found, el);
    if (!found) {
      console.warn('[premium] modal missing, redirecting to /upgrade');
      window.location.href = '/upgrade';
    }
  }, 700);
};

  const handleFreeClick = () => {
    // Free tier handles its own signup flow
  };

  return (
    <>
      <section id="pricing" className="py-6 sm:py-12 lg:py-16 relative overflow-hidden bg-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-3/4 h-3/4 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-3/4 h-3/4 bg-gradient-to-tl from-brand-primary/5 via-transparent to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-10 animate-fade-in">
            <h2 className="font-merriweather text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground">Pricing</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto pt-4 sm:pt-6 px-2 sm:px-0 items-stretch">
            {pricingTiers.map((tier, index) => (
              <PricingTier 
                key={index} 
                {...tier} 
                onButtonClick={tier.isFree ? handleFreeClick : handlePremiumClick} 
              />
            ))}
          </div>
          
          <div className="text-center mt-12 sm:mt-16 animate-fade-in px-4 sm:px-0" style={{ animationDelay: '0.4s' }}>
            <p className="font-montserrat text-muted-foreground text-base sm:text-lg">Start Free. No Credit Card Required. Upgrade or Cancel Anytime.</p>
          </div>
        </div>
      </section>

    </>
  );
};

export default PricingSection;

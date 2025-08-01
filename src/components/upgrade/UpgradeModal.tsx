
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWhopProducts } from '@/hooks/useWhopProducts';
import { WhopProductCard } from './WhopProductCard';
import { WhopEmbeddedCheckout } from './WhopEmbeddedCheckout';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useWhopIntegration } from '@/hooks/useWhopIntegration';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onOpenChange,
  reason = "Unlock premium features",
}) => {
  const navigate = useNavigate();
  const { subscriber, refreshCurrentUser } = useEnhancedAuth();
  const { products, loading, formatPrice, refreshProducts } = useWhopProducts();
  const { syncProducts, isLoading: syncLoading } = useWhopIntegration();
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    productId: string | null;
    productTitle?: string;
  }>({
    open: false,
    productId: null,
  });

  const handlePurchase = (productId: string) => {
    const product = products.find(p => p.whop_product_id === productId);
    
    if (!subscriber) {
      toast.error('Please sign in to continue');
      onOpenChange(false);
      navigate('/login');
      return;
    }

    if (product?.price_cents === 0) {
      toast.success('Welcome to Weekly Wizdom!');
      onOpenChange(false);
      return;
    }

    // Close this modal and open embedded checkout
    onOpenChange(false);
    setCheckoutModal({
      open: true,
      productId,
      productTitle: product?.title,
    });
  };

  const handleCheckoutSuccess = async () => {
    // Refresh user authentication state after successful purchase
    await refreshCurrentUser();
    toast.success('Welcome to Premium! Your access has been upgraded.');
  };

  const handleViewAllPlans = () => {
    onOpenChange(false);
    navigate('/upgrade');
  };

  const handleSyncProducts = async () => {
    try {
      await syncProducts();
      await refreshProducts();
      toast.success('Products refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh products');
    }
  };

  const getCurrentUserTier = () => {
    return subscriber?.subscription_tier || 'free';
  };

  const isCurrentPlan = (productPrice: number) => {
    const userTier = getCurrentUserTier();
    if (userTier === 'free' && productPrice === 0) return true;
    if (userTier === 'paid' && productPrice > 0 && productPrice < 5000) return true;
    if (userTier === 'premium' && productPrice >= 5000) return true;
    return false;
  };

  // Show products with actual pricing (including paid plans)
  const availableProducts = products.filter(p => p.is_active);
  const paidProducts = availableProducts.filter(p => p.price_cents > 0);
  const featuredProducts = paidProducts.slice(0, 2);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-dark border-0">
          <DialogHeader className="relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-0 top-0 p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-3 pr-8">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-gradient-brand rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-3xl font-bold text-white">
                  Upgrade to Premium
                </DialogTitle>
              </div>
              <p className="text-white/70 text-lg">{reason}</p>
              
              {/* Feature highlights */}
              <div className="flex items-center justify-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-brand-success">
                  <div className="w-2 h-2 bg-brand-success rounded-full"></div>
                  <span className="text-sm text-white/80">Exclusive Trading Signals</span>
                </div>
                <div className="flex items-center gap-2 text-brand-success">
                  <div className="w-2 h-2 bg-brand-success rounded-full"></div>
                  <span className="text-sm text-white/80">Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-2 text-brand-success">
                  <div className="w-2 h-2 bg-brand-success rounded-full"></div>
                  <span className="text-sm text-white/80">Premium Chat Access</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 animate-pulse text-brand-primary" />
                  <span className="text-white text-lg">Loading premium plans...</span>
                </div>
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredProducts.map((product, index) => (
                  <div key={product.id} className="relative">
                    {index === 0 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-brand text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <WhopProductCard
                      product={product}
                      onPurchase={handlePurchase}
                      formatPrice={formatPrice}
                      isPopular={index === 0}
                      isCurrentPlan={isCurrentPlan(product.price_cents)}
                      className="card-interactive bg-brand-secondary/50 border-white/10 hover:border-brand-primary/50"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-6">
                <div className="relative">
                  <Sparkles className="h-16 w-16 text-brand-primary mx-auto" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto bg-gradient-brand rounded-full opacity-20 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">No Premium Plans Available</h3>
                  <p className="text-white/70">
                    We're preparing exclusive subscription options! Try refreshing to see the latest plans.
                  </p>
                  <Button
                    onClick={handleSyncProducts}
                    disabled={syncLoading}
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                  >
                    {syncLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Plans
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center space-y-6 border-t border-white/10 pt-6">
              <Button
                onClick={handleViewAllPlans}
                variant="outline"
                className="min-w-[200px] bg-transparent border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300"
              >
                View All Plans & Features
              </Button>
              
              <div className="flex items-center justify-center gap-8 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-brand-success rounded-full flex items-center justify-center">
                    ✓
                  </div>
                  <span>30-day money back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-brand-success rounded-full flex items-center justify-center">
                    ✓
                  </div>
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-brand-success rounded-full flex items-center justify-center">
                    🔒
                  </div>
                  <span>Secure payment via Whop</span>
                </div>
              </div>
              
              {/* Social proof */}
              <div className="text-center">
                <p className="text-white/70 text-sm">
                  Join 1,000s of other traders already using Weekly Wizdom
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Checkout Modal */}
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

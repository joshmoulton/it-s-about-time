import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WhopCheckoutEmbed } from '@whop/react/checkout';
import { Loader2 } from 'lucide-react';
import { openWhopCheckout } from '@/utils/whopCheckoutUtils';

interface WhopEmbeddedCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  productTitle?: string;
  onSuccess?: () => void;
}

export const WhopEmbeddedCheckout: React.FC<WhopEmbeddedCheckoutProps> = ({
  open,
  onOpenChange,
  productId,
  productTitle = 'Product',
  onSuccess
}) => {
  // Minimal setup - remove aggressive CSS that causes issues
  useEffect(() => {
    if (open && productId) {
      const isInIframe = typeof window !== 'undefined' && window.top !== window.self;
      if (isInIframe) {
        // Fallback to opening checkout in a new tab when inside an iframe (preview environment)
        openWhopCheckout(productId, { utm_source: 'app', utm_medium: 'embed_fallback' });
        onOpenChange(false);
        return;
      }
      console.log('Whop checkout modal opened');
    }
  }, [open, productId, onOpenChange]);

  if (!productId) {
    return null;
  }

  const handleSuccess = () => {
    console.log('Checkout completed for plan:', productId);
    onSuccess?.();
    onOpenChange(false);
  };

  const isInIframe = typeof window !== 'undefined' && window.top !== window.self;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] bg-background border border-border shadow-2xl p-0 overflow-hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-center">
              Complete Your Purchase - {productTitle}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Secure checkout for {productTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="h-full min-h-[500px]">
              {!isInIframe ? (
                <WhopCheckoutEmbed 
                  planId={productId!} 
                  theme="light"
                  onComplete={handleSuccess}
                  fallback={
                    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-center space-y-2">
                        <p className="text-lg font-medium text-foreground">Loading secure checkout...</p>
                        <p className="text-sm text-muted-foreground">This should only take a moment</p>
                      </div>
                    </div>
                  } 
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[500px] space-y-2">
                  <p className="text-foreground">Redirecting to secure checkout...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground border-t px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">✓</span>
                </div>
                <span>Secure payment processing by Whop</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
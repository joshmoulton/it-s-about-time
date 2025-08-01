import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WhopCheckoutEmbed } from '@whop/react/checkout';
import { Loader2 } from 'lucide-react';

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
  // Add CSS to hide address fields when modal opens for faster checkout
  useEffect(() => {
    if (open) {
      const style = document.createElement('style');
      style.id = 'whop-checkout-address-hide';
      style.textContent = `
        /* Hide address fields in Whop checkout to speed up payment */
        [data-testid*="address"], 
        [placeholder*="address" i],
        [placeholder*="street" i],
        [placeholder*="city" i],
        [placeholder*="zip" i],
        [placeholder*="postal" i],
        [name*="address" i],
        [name*="street" i],
        [name*="city" i],
        [name*="postal" i],
        .address-field,
        .billing-address,
        .address-container {
          display: none !important;
        }
        /* Hide address labels and containers */
        label[for*="address" i],
        label[for*="street" i],
        label[for*="city" i],
        label[for*="postal" i],
        label:has(+ [placeholder*="address" i]) {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        const existingStyle = document.getElementById('whop-checkout-address-hide');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [open]);

  if (!productId) {
    return null;
  }

  const handleSuccess = () => {
    console.log('Checkout completed for plan:', productId);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] bg-background border border-border shadow-2xl p-0 overflow-hidden">
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
              <WhopCheckoutEmbed 
                planId={productId} 
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
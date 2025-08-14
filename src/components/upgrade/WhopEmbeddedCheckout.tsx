import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WhopCheckoutEmbed } from '@whop/react/checkout';
import { Loader2, X } from 'lucide-react';
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
  // Always try embedded checkout first, only fallback if absolutely necessary
  useEffect(() => {
    if (open && productId) {
      console.log('Whop checkout modal opened for product:', productId);
    }
  }, [open, productId]);

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
      <DialogContent 
        className="p-0 w-[95vw] max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl h-[95vh] max-h-[800px] overflow-hidden flex flex-col mx-auto" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ 
          touchAction: 'none',
          left: '50%',
          transform: 'translateX(-50%)',
          right: 'auto'
        }}
      >
        <div className="flex flex-col h-full">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0 relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close checkout"
            >
              <X className="h-5 w-5" />
            </button>
            <DialogTitle className="text-center text-lg sm:text-xl pr-8">
              Complete Your Purchase - {productTitle}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm sm:text-base">
              Secure checkout for {productTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
            <div className="h-full w-full min-h-[400px]">
              <WhopCheckoutEmbed
                planId={productId!} 
                theme="light"
                onComplete={handleSuccess}
                fallback={
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4 p-6">
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

          <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground border-t px-4 sm:px-6 py-3 flex-shrink-0 bg-muted/30">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
              <span>Secure payment processing by Whop</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
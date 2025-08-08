
import React from 'react';
import { openWhopCheckout } from '@/utils/whopCheckoutUtils';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

interface WhopCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  productTitle?: string;
}

export const WhopCheckoutModal: React.FC<WhopCheckoutModalProps> = ({
  open,
  onOpenChange,
  productId,
  productTitle = 'Product',
}) => {
  const { refreshCurrentUser } = useEnhancedAuth();

  const handleCheckoutSuccess = async () => {
    // Refresh user authentication state after successful purchase
    await refreshCurrentUser();
    
    // You could also trigger a sync of purchases here if needed
    // await syncUserPurchases();
  };

  React.useEffect(() => {
    if (open && productId) {
      openWhopCheckout(productId, { utm_source: 'app', utm_medium: 'checkout_modal', onSuccess: handleCheckoutSuccess });
      onOpenChange(false);
    }
  }, [open, productId]);

  return null;
};

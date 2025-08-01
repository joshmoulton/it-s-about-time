
import React from 'react';
import { WhopEmbeddedCheckout } from './WhopEmbeddedCheckout';
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

  return (
    <WhopEmbeddedCheckout
      open={open}
      onOpenChange={onOpenChange}
      productId={productId}
      productTitle={productTitle}
      onSuccess={handleCheckoutSuccess}
    />
  );
};

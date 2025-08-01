import { useWhopProducts } from './whop/useWhopProducts';
import { useWhopPurchases } from './whop/useWhopPurchases';
import { useBeehiivSync } from './whop/useBeehiivSync';
import { useWhopGatekeeper } from './useWhopGatekeeper';

export const useWhopIntegration = () => {
  const { 
    isLoading: productsLoading, 
    syncProducts 
  } = useWhopProducts();
  
  const { 
    isLoading: purchasesLoading, 
    syncPurchases, 
    verifyPurchase 
  } = useWhopPurchases();
  
  const { 
    isLoading: beehiivLoading, 
    syncProgress, 
    syncBeehiivSubscribers, 
    continueSyncJob, 
    retryFailedItems 
  } = useBeehiivSync();

  const {
    isLoading: gatekeeperLoading,
    grantAccess,
    revokeAccess,
    checkAccess,
    syncAllAccess
  } = useWhopGatekeeper();

  // Combine all loading states
  const isLoading = productsLoading || purchasesLoading || beehiivLoading || gatekeeperLoading;

  return {
    isLoading,
    syncProgress,
    syncProducts,
    syncPurchases,
    verifyPurchase,
    syncBeehiivSubscribers,
    continueSyncJob,
    retryFailedItems,
    // Gatekeeper functions
    grantAccess,
    revokeAccess,
    checkAccess,
    syncAllAccess
  };
};

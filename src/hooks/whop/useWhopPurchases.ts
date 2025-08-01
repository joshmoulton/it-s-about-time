
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withTimeout, handleSyncError } from './utils';

export const useWhopPurchases = () => {
  const [isLoading, setIsLoading] = useState(false);

  const syncPurchases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('whop-integration', {
          body: { action: 'sync_purchases' }
        }),
        8000
      );

      if (error) {
        throw error;
      }

      toast.success(`Synced ${data.synced || 0} purchases from Whop`);
      return data;
    } catch (error) {
      handleSyncError(error, 'sync purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPurchase = async (email: string, productId?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('whop-integration', {
          body: { 
            action: 'verify_purchase',
            email,
            productId
          }
        }),
        6000
      );

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      const isTimeout = error.message.includes('timed out');
      const errorMessage = isTimeout 
        ? 'Verification timed out. Please try again later.'
        : 'Failed to verify purchase';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    syncPurchases,
    verifyPurchase
  };
};

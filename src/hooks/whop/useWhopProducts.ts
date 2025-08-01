
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withTimeout, handleSyncError } from './utils';

export const useWhopProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const syncProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('whop-integration', {
          body: { action: 'sync_products' }
        }),
        8000
      );

      if (error) {
        throw error;
      }

      toast.success(`Synced ${data.synced || 0} products from Whop`);
      return data;
    } catch (error) {
      handleSyncError(error, 'sync products');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    syncProducts
  };
};

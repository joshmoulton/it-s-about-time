import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Simplified Whop integration focused only on products
export const syncWhopProducts = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('whop-integration', {
      body: { action: 'sync_products' }
    });

    if (error) {
      console.error('Error syncing Whop products:', error);
      toast.error('Failed to sync products');
      return false;
    }

    console.log('Whop products synced successfully:', data);
    toast.success('Products synced successfully');
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    toast.error('Failed to sync products');
    return false;
  }
};

export const getWhopProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('whop_products')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching Whop products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const createWhopCheckout = async (productId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('whop-integration', {
      body: { 
        action: 'create_embedded_checkout',
        product_id: productId
      }
    });

    if (error || !data?.success) {
      console.error('Error creating checkout:', error || data);
      toast.error('Failed to create checkout link');
      return null;
    }

    return data.checkout_url;
  } catch (error) {
    console.error('Checkout creation error:', error);
    toast.error('Failed to create checkout');
    return null;
  }
};
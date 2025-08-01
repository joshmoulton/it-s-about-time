import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminStatus } from './useAdminStatus';

export type SubscriptionTier = 'free' | 'paid' | 'premium';

export const useTierOverride = () => {
  const [currentOverride, setCurrentOverride] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdminStatus();

  // Load current override on mount
  useEffect(() => {
    if (isAdmin) {
      loadCurrentOverride();
    }
  }, [isAdmin]);

  const loadCurrentOverride = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_tier_override')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value && typeof data.setting_value === 'object' && 'tier' in data.setting_value) {
        setCurrentOverride((data.setting_value as { tier: SubscriptionTier }).tier);
      } else {
        setCurrentOverride(null);
      }
    } catch (error) {
      console.error('Error loading tier override:', error);
    }
  };

  const setTierOverride = async (tier: SubscriptionTier) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('set_admin_tier_override', {
        override_tier: tier
      });

      if (error) throw error;

      setCurrentOverride(tier);
      toast({
        title: 'Tier Override Set',
        description: `You are now testing as ${tier} tier user`,
      });

      // Refresh the page to apply the changes
      window.location.reload();
    } catch (error: any) {
      console.error('Error setting tier override:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set tier override',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearTierOverride = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('clear_admin_tier_override');

      if (error) throw error;

      setCurrentOverride(null);
      toast({
        title: 'Tier Override Cleared',
        description: 'You are now using your default admin tier',
      });

      // Refresh the page to apply the changes
      window.location.reload();
    } catch (error: any) {
      console.error('Error clearing tier override:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear tier override',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentOverride,
    isLoading,
    setTierOverride,
    clearTierOverride,
    isEnabled: isAdmin
  };
};
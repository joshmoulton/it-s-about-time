
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GatekeeperResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface AccessCheckResponse {
  success: boolean;
  hasAccess: boolean;
  accessRecord?: any;
  error?: string;
}

export const useWhopGatekeeper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const grantAccess = async (email: string, telegramUserId: number, whopPurchaseId?: string): Promise<GatekeeperResponse> => {
    setIsLoading(true);
    try {
      console.log('🔐 Granting Telegram access for:', email);

      const { data, error } = await supabase.functions.invoke('whop-gatekeeper', {
        body: {
          action: 'grant_access',
          email,
          telegram_user_id: telegramUserId,
          whop_purchase_id: whopPurchaseId
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to grant access');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to grant access');
      }

      toast({
        title: "Access Granted",
        description: `Telegram access granted for ${email}`,
      });

      return data;
    } catch (error: any) {
      console.error('❌ Failed to grant access:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to grant Telegram access',
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const revokeAccess = async (email: string, telegramUserId?: number, whopPurchaseId?: string): Promise<GatekeeperResponse> => {
    setIsLoading(true);
    try {
      console.log('🔐 Revoking Telegram access for:', email);

      const { data, error } = await supabase.functions.invoke('whop-gatekeeper', {
        body: {
          action: 'revoke_access',
          email,
          telegram_user_id: telegramUserId,
          whop_purchase_id: whopPurchaseId
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to revoke access');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to revoke access');
      }

      toast({
        title: "Access Revoked",
        description: `Telegram access revoked for ${email}`,
      });

      return data;
    } catch (error: any) {
      console.error('❌ Failed to revoke access:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to revoke Telegram access',
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = async (email: string): Promise<AccessCheckResponse> => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking Telegram access for:', email);

      const { data, error } = await supabase.functions.invoke('whop-gatekeeper', {
        body: {
          action: 'check_access',
          email
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to check access');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to check access');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Failed to check access:', error);
      return { success: false, hasAccess: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllAccess = async (): Promise<GatekeeperResponse> => {
    setIsLoading(true);
    try {
      console.log('🔄 Syncing all Telegram access...');

      const { data, error } = await supabase.functions.invoke('whop-gatekeeper', {
        body: {
          action: 'sync_access'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to sync access');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync access');
      }

      toast({
        title: "Sync Complete",
        description: `Granted: ${data.granted}, Revoked: ${data.revoked}`,
      });

      return data;
    } catch (error: any) {
      console.error('❌ Failed to sync access:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to sync Telegram access',
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    grantAccess,
    revokeAccess,
    checkAccess,
    syncAllAccess
  };
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

export interface TelegramPermissions {
  canSend: boolean;
  permissions?: {
    dailyLimit: number;
    messagesSentToday: number;
    remainingMessages: number;
    requiresApproval: boolean;
    isApproved: boolean;
    bannedUntil?: string;
  };
  error?: string;
}

export function useTelegramPermissions() {
  const { currentUser } = useEnhancedAuth();

  return useQuery({
    queryKey: ['telegram-permissions', currentUser?.email],
    queryFn: async (): Promise<TelegramPermissions> => {
      if (!currentUser?.email) {
        return { canSend: false, error: 'User not authenticated' };
      }

      // Disabled - external bot manages permissions
      return { 
        canSend: false, 
        error: 'Permission checks disabled - external bot is active' 
      };
    },
    enabled: false, // Disabled - external bot manages permissions
    staleTime: Infinity,
    refetchInterval: false, // Disabled - external bot handles updates
    refetchOnWindowFocus: false,
  });
}

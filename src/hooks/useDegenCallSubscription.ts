import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DegenCallSubscription {
  id: string;
  user_email: string;
  telegram_user_id?: number;
  telegram_username?: string;
  is_active: boolean;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface DegenCallNotification {
  id: string;
  analyst_signal_id: string;
  message_content: string;
  recipient_count: number;
  status: string;
  sent_at: string;
  error_message?: string;
}

export function useDegenCallSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCurrentUserEmail = async (): Promise<string | null> => {
    // Try Supabase Auth first
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) return user.email;
    
    // Fallback to enhanced auth context
    try {
      const { data, error } = await supabase.rpc('get_current_user_email_optimized');
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  };

  // Get current user's subscription status
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ['degen-call-subscription'],
    queryFn: async (): Promise<DegenCallSubscription | null> => {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return null;

      const { data, error } = await supabase
        .from('degen_call_subscriptions')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Translate RLS errors to user-friendly messages
        if (error.message.includes('violates row-level security policy')) {
          throw new Error('Access denied. Please ensure you are properly authenticated.');
        }
        throw new Error('Failed to load subscription settings. Please try again.');
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry RLS errors
      if (error?.message?.includes('Access denied')) return false;
      return failureCount < 2;
    }
  });

  // Get recent notifications
  const { data: recentNotifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['recent-degen-notifications'],
    queryFn: async (): Promise<DegenCallNotification[]> => {
      const { data, error } = await supabase
        .from('degen_call_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Remove duplicates based on analyst_signal_id
      const uniqueNotifications = data?.reduce((acc: DegenCallNotification[], current) => {
        const exists = acc.find(item => item.analyst_signal_id === current.analyst_signal_id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []) || [];
      
      return uniqueNotifications;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 15, // 15 seconds
  });

  // Subscribe to degen calls
  const subscribeMutation = useMutation({
    mutationFn: async ({ telegramUserId, telegramUsername }: {
      telegramUserId?: number;
      telegramUsername?: string;
    }) => {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) throw new Error('Please log in to continue');

      // Get user's subscription tier from secure system
      const { data: whopUser } = await supabase
        .from('whop_authenticated_users')
        .select('subscription_tier')
        .eq('user_email', userEmail)
        .single();

      // Use upsert to avoid duplicates
      const { error } = await supabase
        .from('degen_call_subscriptions')
        .upsert({
          user_email: userEmail,
          telegram_user_id: telegramUserId,
          telegram_username: telegramUsername,
          is_active: true,
          subscription_tier: whopUser?.subscription_tier || 'free'
        }, {
          onConflict: 'user_email'
        });

      if (error) {
        // Translate RLS errors to user-friendly messages
        if (error.message.includes('violates row-level security policy')) {
          throw new Error('Access denied. Please ensure you have proper permissions.');
        }
        if (error.message.includes('duplicate key')) {
          throw new Error('Subscription already exists. Please try updating your settings instead.');
        }
        throw new Error('Failed to save subscription. Please try again.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['degen-call-subscription'] });
      toast({
        title: "Settings Saved!",
        description: "Your Telegram notification settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Unsubscribe from degen calls
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) throw new Error('Please log in to continue');

      const { error } = await supabase
        .from('degen_call_subscriptions')
        .update({ is_active: false })
        .eq('user_email', userEmail);

      if (error) {
        // Translate RLS errors to user-friendly messages
        if (error.message.includes('violates row-level security policy')) {
          throw new Error('Access denied. Please ensure you have proper permissions.');
        }
        throw new Error('Failed to disable notifications. Please try again.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['degen-call-subscription'] });
      toast({
        title: "Notifications Disabled",
        description: "You've disabled Telegram notifications.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update subscription with telegram data
  const updateSubscription = async (telegramData: {
    telegramUserId?: number;
    telegramUsername?: string;
  }) => {
    await subscribeMutation.mutateAsync(telegramData);
  };

  // Toggle subscription
  const toggleSubscription = async (telegramData?: {
    telegramUserId?: number;
    telegramUsername?: string;
  }) => {
    try {
      if (subscription?.is_active) {
        await unsubscribeMutation.mutateAsync();
      } else {
        await subscribeMutation.mutateAsync(telegramData || {});
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      throw error;
    }
  };

  return {
    subscription,
    recentNotifications,
    isSubscribed: subscription?.is_active || false,
    subscriptionLoading,
    notificationsLoading,
    subscriptionError,
    toggleSubscription,
    updateSubscription,
    isToggling: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}
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

  // Get current user's subscription status
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['degen-call-subscription'],
    queryFn: async (): Promise<DegenCallSubscription | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;

      console.log('Fetching degen call subscription for:', user.email);

      const { data, error } = await supabase
        .from('degen_call_subscriptions')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      console.log('Fetched subscription data:', data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      // Get user's subscription tier from secure system
      const { data: whopUser } = await supabase
        .from('whop_authenticated_users')
        .select('subscription_tier')
        .eq('user_email', user.email)
        .single();

      // Use upsert to avoid duplicates
      const { error } = await supabase
        .from('degen_call_subscriptions')
        .upsert({
          user_email: user.email,
          telegram_user_id: telegramUserId,
          telegram_username: telegramUsername,
          is_active: true,
          subscription_tier: whopUser?.subscription_tier || 'free'
        }, {
          onConflict: 'user_email'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['degen-call-subscription'] });
      toast({
        title: "Subscribed!",
        description: "You're now subscribed to degen call alerts.",
      });
    },
    onError: (error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Unsubscribe from degen calls
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('degen_call_subscriptions')
        .update({ is_active: false })
        .eq('user_email', user.email);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['degen-call-subscription'] });
      toast({
        title: "Unsubscribed",
        description: "You've been unsubscribed from degen call alerts.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unsubscribe Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle subscription
  const toggleSubscription = async (telegramData?: {
    telegramUserId?: number;
    telegramUsername?: string;
  }) => {
    console.log('Toggling subscription. Current state:', subscription?.is_active);
    try {
      if (subscription?.is_active) {
        console.log('Unsubscribing from degen calls');
        await unsubscribeMutation.mutateAsync();
      } else {
        console.log('Subscribing to degen calls');
        await subscribeMutation.mutateAsync(telegramData || {});
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  return {
    subscription,
    recentNotifications,
    isSubscribed: subscription?.is_active || false,
    subscriptionLoading,
    notificationsLoading,
    toggleSubscription,
    isToggling: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}
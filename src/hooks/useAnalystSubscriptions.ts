import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalystSubscription {
  id: string;
  user_email: string;
  analyst_name: string;
  telegram_user_id?: number;
  telegram_username?: string;
  is_active: boolean;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface AnalystInfo {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface Analyst {
  info: AnalystInfo;
  isSubscribed: boolean;
}

export function useAnalystSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available analysts from the analysts table
  const { data: availableAnalysts = [], isLoading: analystsLoading } = useQuery({
    queryKey: ['available-analysts'],
    queryFn: async (): Promise<AnalystInfo[]> => {
      const { data, error } = await supabase
        .from('analysts')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get user's analyst subscriptions
  const { data: userSubscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['analyst-subscriptions'],
    queryFn: async (): Promise<AnalystSubscription[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('analyst_degen_subscriptions')
        .select('*')
        .eq('user_email', user.email)
        .eq('is_active', true)
        .order('analyst_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine analysts with subscription status
  const analystsWithSubscriptionStatus: Analyst[] = availableAnalysts.map(analyst => ({
    info: analyst,
    isSubscribed: userSubscriptions.some(sub => sub.analyst_name === analyst.name && sub.is_active)
  }));

  // Subscribe to specific analyst
  const subscribeToAnalystMutation = useMutation({
    mutationFn: async ({ 
      analystName, 
      telegramUserId, 
      telegramUsername 
    }: {
      analystName: string;
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
        .from('analyst_degen_subscriptions')
        .upsert({
          user_email: user.email,
          analyst_name: analystName,
          telegram_user_id: telegramUserId,
          telegram_username: telegramUsername,
          is_active: true,
          subscription_tier: whopUser?.subscription_tier || 'free'
        }, {
          onConflict: 'user_email,analyst_name'
        });

      if (error) throw error;
    },
    onSuccess: (_, { analystName }) => {
      queryClient.invalidateQueries({ queryKey: ['analyst-subscriptions'] });
      toast({
        title: "Subscribed!",
        description: `You're now subscribed to alerts from ${analystName}.`,
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

  // Unsubscribe from specific analyst
  const unsubscribeFromAnalystMutation = useMutation({
    mutationFn: async (analystName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('analyst_degen_subscriptions')
        .update({ is_active: false })
        .eq('user_email', user.email)
        .eq('analyst_name', analystName);

      if (error) throw error;
    },
    onSuccess: (_, analystName) => {
      queryClient.invalidateQueries({ queryKey: ['analyst-subscriptions'] });
      toast({
        title: "Unsubscribed",
        description: `You've been unsubscribed from alerts from ${analystName}.`,
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

  // Toggle subscription for specific analyst
  const toggleAnalystSubscription = async (
    analystName: string, 
    telegramData?: {
      telegramUserId?: number;
      telegramUsername?: string;
    }
  ) => {
    const isCurrentlySubscribed = userSubscriptions.some(
      sub => sub.analyst_name === analystName && sub.is_active
    );

    if (isCurrentlySubscribed) {
      unsubscribeFromAnalystMutation.mutate(analystName);
    } else {
      subscribeToAnalystMutation.mutate({
        analystName,
        ...telegramData
      });
    }
  };

  return {
    availableAnalysts,
    userSubscriptions,
    analystsWithSubscriptionStatus,
    analystsLoading,
    subscriptionsLoading,
    toggleAnalystSubscription,
    isToggling: subscribeToAnalystMutation.isPending || unsubscribeFromAnalystMutation.isPending,
    subscribeToAnalyst: subscribeToAnalystMutation.mutate,
    unsubscribeFromAnalyst: unsubscribeFromAnalystMutation.mutate,
  };
}
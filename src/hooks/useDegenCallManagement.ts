import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DegenCallSubscription {
  id: string;
  user_email: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

export interface DegenCallNotification {
  id: string;
  analyst_signal_id: string;
  telegram_message_id: number | null;
  sent_at: string;
  recipient_count: number;
  message_content: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function useDegenCallManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch degen call subscriptions
  const {
    data: subscriptions,
    isLoading: subscriptionsLoading,
    error: subscriptionsError
  } = useQuery({
    queryKey: ['degen-call-subscriptions'],
    queryFn: async (): Promise<DegenCallSubscription[]> => {
      console.log('📊 Fetching degen call subscriptions...');
      
      const { data, error } = await supabase
        .from('degen_call_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching degen subscriptions:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} degen call subscriptions`);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch degen call notifications
  const {
    data: notifications,
    isLoading: notificationsLoading,
    error: notificationsError
  } = useQuery({
    queryKey: ['degen-call-notifications'],
    queryFn: async (): Promise<DegenCallNotification[]> => {
      console.log('📊 Fetching degen call notifications...');
      
      const { data, error } = await supabase
        .from('degen_call_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching degen notifications:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} degen call notifications`);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Send degen call mutation
  const sendDegenCallMutation = useMutation({
    mutationFn: async (analystSignalId: string) => {
      console.log('🚨 Sending degen call for signal:', analystSignalId);
      
      const { data, error } = await supabase.functions.invoke('degen-call-notifier', {
        body: {
          analyst_signal_id: analystSignalId,
          trigger_type: 'manual'
        }
      });

      if (error) {
        console.error('❌ Error sending degen call:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send degen call');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Degen call sent successfully:', data);
      toast({
        title: "Degen Call Sent!",
        description: `Sent to ${data.stats?.sent || 0} subscribers`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['degen-call-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['analyst-signals'] });
    },
    onError: (error) => {
      console.error('❌ Failed to send degen call:', error);
      toast({
        title: "Failed to Send Degen Call",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle subscription status mutation
  const toggleSubscriptionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      console.log('🔄 Toggling degen subscription:', id, isActive);
      
      const { data, error } = await supabase
        .from('degen_call_subscriptions')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error toggling subscription:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Subscription toggled successfully:', data);
      toast({
        title: "Subscription Updated",
        description: `Degen call subscription ${data.is_active ? 'activated' : 'deactivated'}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['degen-call-subscriptions'] });
    },
    onError: (error) => {
      console.error('❌ Failed to toggle subscription:', error);
      toast({
        title: "Failed to Update Subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    subscriptions: subscriptions || [],
    notifications: notifications || [],
    
    // Loading states
    subscriptionsLoading,
    notificationsLoading,
    isSendingDegenCall: sendDegenCallMutation.isPending,
    isTogglingSubscription: toggleSubscriptionMutation.isPending,
    
    // Error states
    subscriptionsError,
    notificationsError,
    
    // Actions
    sendDegenCall: sendDegenCallMutation.mutate,
    toggleSubscription: toggleSubscriptionMutation.mutate,
    
    // Stats
    totalSubscribers: subscriptions?.length || 0,
    activeSubscribers: subscriptions?.filter(s => s.is_active)?.length || 0,
    totalNotifications: notifications?.length || 0,
  };
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface TelegramMessage {
  id: string;
  telegram_message_id: number;
  chat_id: number;
  user_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  message_text?: string;
  message_type: string;
  message_thread_id?: number;
  topic_name?: string;
  reply_to_message_id?: number;
  forwarded_from?: string;
  media_url?: string;
  media_type?: string;
  timestamp: string;
  is_highlighted: boolean;
  is_hidden: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatHighlight {
  id: string;
  telegram_message_id: string;
  promoted_by?: string;
  promoted_at: string;
  priority_order: number;
  custom_title?: string;
  custom_description?: string;
  telegram_messages: TelegramMessage;
}

export function useTelegramMessages(limit: number = 20) {
  const queryClient = useQueryClient();

  // Set up realtime subscription for instant updates
  useEffect(() => {
    console.log('🔗 Setting up realtime subscription for telegram messages');
    
    const channel = supabase
      .channel('telegram-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telegram_messages'
        },
        (payload) => {
          console.log('📨 New telegram message received:', payload);
          queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telegram_messages'
        },
        (payload) => {
          console.log('📝 Telegram message updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up telegram messages subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['telegram-messages', limit],
    queryFn: async () => {
      console.log('🔄 Fetching telegram messages from database...');
      
      // First try to get messages from database
      const { data, error } = await supabase
        .from('telegram_messages')
        .select('*')
        .order('message_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }
      
      console.log('✅ Retrieved messages from database:', data?.length || 0);
      
      // Auto-sync disabled - external bot handles all syncing
      console.log('ℹ️ Auto-sync disabled: External bot manages all updates');
      
      return (data || []) as any; // Type assertion for schema mismatch
    },
    refetchInterval: false, // Disabled - external bot handles updates
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useChatHighlights(limit: number = 5) {
  return useQuery({
    queryKey: ['chat-highlights', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_highlights')
        .select(`
          *,
          telegram_messages (*)
        `)
        .order('priority_order', { ascending: false })
        .order('promoted_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as any; // Type assertion for schema mismatch
    },
    refetchInterval: false, // Disabled - external bot handles updates
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useAdminFeedControls() {
  return useQuery({
    queryKey: ['admin-feed-controls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_feed_controls')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });
}

// Hook to manually fetch messages from Telegram
export function useFetchTelegramMessages() {
  return async () => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        method: 'GET',
        body: { action: 'fetch_messages' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
      throw error;
    }
  };
}

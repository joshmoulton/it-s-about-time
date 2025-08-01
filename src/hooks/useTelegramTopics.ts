
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TelegramTopic {
  id: string;
  telegram_topic_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  message_count: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export function useTelegramTopics() {
  return useQuery({
    queryKey: ['telegram-topics'],
    queryFn: async (): Promise<TelegramTopic[]> => {
      const { data, error } = await supabase
        .from('telegram_topics')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as TelegramTopic[];
    },
    staleTime: Infinity,
    refetchInterval: false, // Disabled - external bot handles updates
    refetchOnWindowFocus: false,
  });
}

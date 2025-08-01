
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TelegramMessage } from '@/hooks/useTelegramMessages';

export interface OptimizedTelegramMessage extends TelegramMessage {
  auto_highlights?: Array<{
    id: string;
    rule_id: string;
    priority_score: number;
    highlight_color: string;
    highlight_style: string;
    rule_name: string;
  }>;
}

export function useOptimizedTelegramMessages(limit: number = 20) {
  return useQuery({
    queryKey: ['optimized-telegram-messages', limit],
    queryFn: async (): Promise<OptimizedTelegramMessage[]> => {
      const { data, error } = await supabase
        .from('telegram_messages')
        .select(`
          *,
          auto_highlights:auto_highlights(
            id,
            rule_id,
            priority_score,
            chat_highlight_rules:rule_id(
              highlight_color,
              highlight_style,
              rule_name
            )
          )
        `)
        .order('message_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform the data to flatten the highlight information
      return (data as any[]).map(message => ({
        ...message,
        auto_highlights: message.auto_highlights?.map((highlight: any) => ({
          id: highlight.id,
          rule_id: highlight.rule_id,
          priority_score: highlight.priority_score,
          highlight_color: highlight.chat_highlight_rules?.highlight_color || '#fbbf24',
          highlight_style: highlight.chat_highlight_rules?.highlight_style || 'background',
          rule_name: highlight.chat_highlight_rules?.rule_name || 'Unknown Rule',
        })) || []
      }));
    },
    refetchInterval: 60000, // Reduced from 30 seconds to 60 seconds to prevent flooding
    staleTime: 30000, // Keep data fresh for 30 seconds
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: true,
  });
}

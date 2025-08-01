
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TelegramMessage } from '@/hooks/useTelegramMessages';
import { useQueryPerformanceTracker } from '@/components/PerformanceOptimizer';

export interface EnhancedTelegramMessage extends TelegramMessage {
  auto_highlights?: Array<{
    id: string;
    rule_id: string;
    priority_score: number;
    highlight_color: string;
    highlight_style: string;
    rule_name: string;
  }>;
}

export function useEnhancedTelegramMessages(limit: number = 20) {
  const query = useQuery({
    queryKey: ['enhanced-telegram-messages', limit],
    queryFn: async (): Promise<EnhancedTelegramMessage[]> => {
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
    refetchInterval: 120000, // Optimized: Increased to 2 minutes
    staleTime: 60000, // Optimized: Keep data fresh for 60 seconds 
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus
    retry: 1, // Reduce retry attempts
  });

  // Performance tracking
  useQueryPerformanceTracker('enhanced-telegram-messages', query.isLoading, query.data);

  return query;
}

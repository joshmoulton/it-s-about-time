import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KeywordHighlight {
  keyword: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  color: string;
  latest_mentions: Array<{
    id: string;
    message_text: string;
    username: string;
    first_name: string;
    timestamp: string;
    likes_count: number;
  }>;
}

export function useChatHighlights(hoursBack: number = 6) {
  return useQuery({
    queryKey: ['chat-highlights', hoursBack],
    queryFn: async (): Promise<KeywordHighlight[]> => {
      // Get messages from the last specified hours
      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - hoursBack);

      const { data: recentMessages, error } = await supabase
        .from('telegram_messages')
        .select('*')
        .gte('message_time', timeThreshold.toISOString())
        .order('message_time', { ascending: false });

      if (error) throw error;

      // Analyze keywords
      const keywordMap = new Map<string, KeywordHighlight>();

      // Trading/crypto keywords to track
      const targetKeywords = [
        '$BTC', 'BTC', 'Bitcoin',
        '$ETH', 'ETH', 'Ethereum', 
        '$SOL', 'SOL', 'Solana',
        'calls', 'puts', 'options',
        'bullish', 'bearish', 'moon',
        'buy', 'sell', 'pump', 'dump',
        'long', 'short', 'TP', 'SL',
        'SPY', 'QQQ', 'TSLA',
        'resistance', 'support',
        'breakout', 'breakdown'
      ];

      recentMessages?.forEach((message: any) => {
        if (!message.message_text) return;

        const text = message.message_text.toLowerCase();
        
        targetKeywords.forEach(keyword => {
          const keywordLower = keyword.toLowerCase();
          
          if (text.includes(keywordLower)) {
            const existing = keywordMap.get(keyword);
            
            if (existing) {
              existing.count++;
              existing.latest_mentions.push({
                id: String(message.id),
                message_text: message.message_text,
                username: message.username || '',
                first_name: message.first_name || '',
                timestamp: message.message_time || new Date().toISOString(),
                likes_count: message.likes_count || 0
              });
              // Keep only the 3 most recent mentions
              existing.latest_mentions = existing.latest_mentions
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 3);
            } else {
              // Determine sentiment based on context
              let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
              let color = '#6b7280'; // gray
              
              if (text.includes('bullish') || text.includes('moon') || text.includes('pump') || text.includes('buy') || text.includes('long') || text.includes('breakout')) {
                sentiment = 'bullish';
                color = '#10b981'; // green
              } else if (text.includes('bearish') || text.includes('dump') || text.includes('sell') || text.includes('short') || text.includes('breakdown')) {
                sentiment = 'bearish';
                color = '#ef4444'; // red
              }

              keywordMap.set(keyword, {
                keyword,
                count: 1,
                sentiment,
                color,
                latest_mentions: [{
                  id: String(message.id),
                  message_text: message.message_text,
                  username: message.username || '',
                  first_name: message.first_name || '',
                  timestamp: message.message_time || new Date().toISOString(),
                  likes_count: message.likes_count || 0
                }]
              });
            }
          }
        });
      });

      // Convert to array and sort by count
      const highlights = Array.from(keywordMap.values())
        .filter(highlight => highlight.count >= 2) // Only show keywords mentioned at least 2 times
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Limit to top 8

      return highlights;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 240000, // Keep data fresh for 4 minutes
  });
}

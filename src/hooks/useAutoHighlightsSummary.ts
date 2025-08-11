import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HighlightMention {
  id: string;
  message_text: string | null;
  username: string | null;
  first_name: string | null;
  timestamp: string;
}

export interface KeywordHighlightSummary {
  keyword: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  color: string;
  latest_mentions: HighlightMention[];
}

function inferSentimentFromText(text?: string | null): 'bullish' | 'bearish' | 'neutral' {
  if (!text) return 'neutral';
  const t = text.toLowerCase();
  if (/(pump|moon|rip|bull|long|green|breakout)/.test(t)) return 'bullish';
  if (/(dump|bear|short|red|downtrend|rug)/.test(t)) return 'bearish';
  return 'neutral';
}

export function useAutoHighlightsSummary(hoursBack = 24) {
  return useQuery<KeywordHighlightSummary[]>({
    queryKey: ['autoHighlightsSummary', hoursBack],
    queryFn: async () => {
      const sinceISO = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      // 1) Fetch recent auto_highlights
      const { data: autoRows, error: autoErr } = await supabase
        .from('auto_highlights')
        .select('id, rule_id, telegram_message_id, assigned_at, priority_score')
        .gte('assigned_at', sinceISO)
        .order('assigned_at', { ascending: false })
        .limit(300);

      if (autoErr) {
        console.error('useAutoHighlightsSummary: auto_highlights error', autoErr);
        return [];
      }

      if (!autoRows || autoRows.length === 0) {
        console.debug('useAutoHighlightsSummary: no auto_highlights in window');
        return [];
      }

      const ruleIds = Array.from(new Set(autoRows.map(r => r.rule_id).filter(Boolean))) as string[];
      const messageIds = Array.from(new Set(autoRows.map(r => r.telegram_message_id).filter(Boolean))) as string[];

      // 2) Try to fetch rules (may be admin-only; fail soft)
      let rulesMap = new Map<string, { rule_name?: string | null; highlight_color?: string | null }>();
      if (ruleIds.length > 0) {
        const { data: rulesData, error: rulesErr } = await supabase
          .from('chat_highlight_rules')
          .select('id, rule_name, highlight_color')
          .in('id', ruleIds);
        if (rulesErr) {
          console.debug('useAutoHighlightsSummary: rules not accessible for this user (OK)', rulesErr.message);
        } else if (rulesData) {
          rulesData.forEach((r: any) => rulesMap.set(r.id, { rule_name: r.rule_name, highlight_color: r.highlight_color }));
        }
      }

      // 3) Fetch messages (fail soft if restricted)
      let messagesMap = new Map<string, { id: string; message_text: string | null; username: string | null; first_name: string | null; timestamp: string }>();
      if (messageIds.length > 0) {
        const { data: msgData, error: msgErr } = await supabase
          .from('telegram_messages')
          .select('id, message_text, username, first_name, timestamp')
          .in('id', messageIds);
        if (msgErr) {
          console.debug('useAutoHighlightsSummary: telegram_messages not accessible for this user (OK)', msgErr.message);
        } else if (msgData) {
          msgData.forEach((m: any) => messagesMap.set(m.id, m));
        }
      }

      // 4) Aggregate by rule_id
      const grouped = new Map<string, { keyword: string; color: string; count: number; mentions: HighlightMention[]; sentimentCounts: Record<string, number> }>();

      for (const row of autoRows) {
        const ruleId = row.rule_id as string | null;
        const key = ruleId || 'unknown';
        const rule = ruleId ? rulesMap.get(ruleId) : undefined;
        const baseKeyword = rule?.rule_name || 'Auto Highlight';
        const color = rule?.highlight_color || '#fbbf24';

        const message = row.telegram_message_id ? messagesMap.get(row.telegram_message_id) : undefined;
        const mention: HighlightMention | null = message
          ? { id: message.id, message_text: message.message_text, username: message.username, first_name: message.first_name, timestamp: message.timestamp }
          : null;

        if (!grouped.has(key)) {
          grouped.set(key, { keyword: baseKeyword, color, count: 0, mentions: [], sentimentCounts: { bullish: 0, bearish: 0, neutral: 0 } });
        }
        const bucket = grouped.get(key)!;
        bucket.count += 1;
        if (mention) {
          bucket.mentions.push(mention);
          const s = inferSentimentFromText(mention.message_text);
          bucket.sentimentCounts[s] = (bucket.sentimentCounts[s] || 0) + 1;
        }
      }

      // 5) Convert to array and compute sentiment; sort by count desc
      const results: KeywordHighlightSummary[] = Array.from(grouped.values()).map(g => {
        const sentiment = (Object.entries(g.sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral') as 'bullish' | 'bearish' | 'neutral';
        const latest_mentions = g.mentions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3);
        return { keyword: g.keyword, count: g.count, sentiment, color: g.color, latest_mentions };
      }).sort((a, b) => b.count - a.count).slice(0, 8);

      return results;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SentimentAnalysis {
  id: string;
  telegram_message_id: string;
  sentiment_score: number;
  sentiment_label: string;
  confidence_score: number;
  emotional_tone: string;
  topic_categories: string[];
  keywords_detected: string[];
  analysis_metadata: any;
  created_at: string;
}

export interface SentimentTrend {
  id: string;
  time_period: string;
  period_type: string;
  avg_sentiment_score: number;
  message_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  dominant_topics: string[];
  trending_keywords: string[];
}

export interface SentimentAlert {
  id: string;
  alert_type: string;
  severity: string;
  sentiment_threshold: number;
  triggered_at: string;
  message_count: number;
  avg_sentiment: number;
  alert_data: any;
  is_resolved: boolean;
  resolved_at?: string;
}

export function useSentimentAnalytics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get recent sentiment analyses - optimized query
  const sentimentAnalyses = useQuery({
    queryKey: ['sentiment-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_sentiment_analysis')
        .select(`
          id,
          telegram_message_id,
          sentiment_score,
          sentiment_label,
          confidence_score,
          emotional_tone,
          topic_categories,
          keywords_detected,
          created_at,
          telegram_messages!inner(
            message_text,
            username,
            first_name,
            timestamp
          )
        `)
        .order('created_at', { ascending: false })
        .limit(30); // Reduced from 50 to 30 for faster loading

      if (error) throw error;
      return data as (SentimentAnalysis & { telegram_messages: any })[];
    },
    refetchInterval: 60000, // Optimized: Refresh every 60 seconds instead of 30
    staleTime: 30000, // Keep data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });

  // Get sentiment trends - optimized query
  const sentimentTrends = useQuery({
    queryKey: ['sentiment-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentiment_trends')
        .select(`
          id,
          time_period,
          period_type,
          avg_sentiment_score,
          message_count,
          positive_count,
          negative_count,
          neutral_count,
          dominant_topics,
          trending_keywords
        `)
        .eq('period_type', 'hourly')
        .gte('time_period', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('time_period', { ascending: true });

      if (error) throw error;
      return data as SentimentTrend[];
    },
    refetchInterval: 2 * 60000, // Optimized: Refresh every 2 minutes instead of 1
    staleTime: 60000, // Keep data fresh for 60 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Get active alerts - optimized query
  const sentimentAlerts = useQuery({
    queryKey: ['sentiment-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentiment_alerts')
        .select(`
          id,
          alert_type,
          severity,
          sentiment_threshold,
          triggered_at,
          message_count,
          avg_sentiment,
          is_resolved,
          resolved_at
        `)
        .order('triggered_at', { ascending: false })
        .limit(15); // Reduced from 20 to 15

      if (error) throw error;
      return data as SentimentAlert[];
    },
    refetchInterval: 60000, // Optimized: Refresh every 60 seconds instead of 30
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Trigger manual sentiment analysis
  const triggerSentimentAnalysis = useMutation({
    mutationFn: async (params: { messageIds?: string[]; analyzeRecent?: boolean }) => {
      if (params.analyzeRecent) {
        // Analyze recent messages without sentiment data
        const { data: recentMessages } = await supabase
          .from('telegram_messages')
          .select('id, message_text')
          .not('message_text', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!recentMessages?.length) {
          throw new Error('No recent messages found');
        }

        // Filter out messages that already have sentiment analysis
        const { data: existingAnalyses } = await supabase
          .from('telegram_sentiment_analysis')
          .select('telegram_message_id')
          .in('telegram_message_id', recentMessages.map(m => String(m.id)));

        const existingIds = new Set(existingAnalyses?.map(a => String(a.telegram_message_id)) || []);
        const messagesToAnalyze = recentMessages.filter(m => !existingIds.has(String(m.id)));

        if (!messagesToAnalyze.length) {
          throw new Error('All recent messages already have sentiment analysis');
        }

        const { data, error } = await supabase.functions.invoke('telegram-sentiment-analyzer', {
          body: {
            batchMode: true,
            messages: messagesToAnalyze
          }
        });

        if (error) throw error;
        return data;
      } else if (params.messageIds) {
        // Analyze specific messages
        const { data: messages } = await supabase
          .from('telegram_messages')
          .select('id, message_text')
          .in('id', params.messageIds.map(String))
          .not('message_text', 'is', null);

        if (!messages?.length) {
          throw new Error('No valid messages found');
        }

        const { data, error } = await supabase.functions.invoke('telegram-sentiment-analyzer', {
          body: {
            batchMode: true,
            messages
          }
        });

        if (error) throw error;
        return data;
      }

      throw new Error('Invalid parameters');
    },
    onSuccess: (data) => {
      toast({
        title: "Sentiment Analysis Complete",
        description: `Analyzed ${data.processed || 0} messages successfully`,
      });
      
      // Refresh all sentiment-related queries
      queryClient.invalidateQueries({ queryKey: ['sentiment-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['sentiment-trends'] });
      queryClient.invalidateQueries({ queryKey: ['sentiment-alerts'] });
    },
    onError: (error) => {
      toast({
        title: "Sentiment Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resolve sentiment alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('sentiment_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Alert Resolved",
        description: "Sentiment alert has been marked as resolved",
      });
      queryClient.invalidateQueries({ queryKey: ['sentiment-alerts'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Resolve Alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Aggregate sentiment trends manually
  const aggregateTrends = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('aggregate_sentiment_trends');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Trends Updated",
        description: "Sentiment trends have been recalculated",
      });
      queryClient.invalidateQueries({ queryKey: ['sentiment-trends'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Trends",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Queries
    sentimentAnalyses,
    sentimentTrends,
    sentimentAlerts,
    
    // Mutations
    triggerSentimentAnalysis,
    resolveAlert,
    aggregateTrends,
    
    // Loading states
    isLoading: sentimentAnalyses.isLoading || sentimentTrends.isLoading || sentimentAlerts.isLoading,
    isTriggeringAnalysis: triggerSentimentAnalysis.isPending,
    isResolvingAlert: resolveAlert.isPending,
    isAggregatingTrends: aggregateTrends.isPending,
  };
}
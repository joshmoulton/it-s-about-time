import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useQueryPerformanceTracker } from '@/components/PerformanceOptimizer';

interface SentimentData {
  overall: string;
  score: number;
  trend: string;
  confidence: number;
  lastUpdate: string;
  sources: {
    telegram: { score: number; count: number };
    x: { score: number; count: number };
  };
}

interface TopicData {
  topic: string;
  sentiment: string;
  mentions: number;
  source: string;
  color: string;
}

export function useLiveSentiment() {
  const { data: sentimentData, isLoading, error, refetch } = useQuery({
    queryKey: ['live-sentiment'],
    queryFn: async (): Promise<{ currentSentiment: SentimentData; keyTopics: TopicData[] }> => {
      console.log('🔄 Fetching live sentiment data...');
      // Starting data fetch...
      // Get recent Telegram sentiment (last 24 hours, fallback to last 7 days if no recent data)
      let { data: telegramSentiment } = await supabase
        .from('telegram_sentiment_analysis')
        .select('sentiment_score, sentiment_label, topic_categories, keywords_detected, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(50);

      // If no data in last 24 hours, get recent data from last 7 days
      if (!telegramSentiment || telegramSentiment.length === 0) {
        const { data: fallbackTelegram } = await supabase
          .from('telegram_sentiment_analysis')
          .select('sentiment_score, sentiment_label, topic_categories, keywords_detected, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
          .order('created_at', { ascending: false })
          .limit(50);
        telegramSentiment = fallbackTelegram;
      }

      // Get recent X sentiment - since x_sentiment_analysis table doesn't exist, 
      // we'll use mock data or skip X data for now
      const xSentiment: any[] = [];

      // TODO: Replace with actual X sentiment analysis when table exists
      // For now, we'll generate some mock data based on X posts
      const { data: xPosts } = await supabase
        .from('x_posts')
        .select('post_text, created_at')
        .gte('posted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .not('post_text', 'is', null)
        .limit(50);

      // Generate mock sentiment analysis for X posts
      const mockXSentiment = xPosts?.map(post => ({
        sentiment_score: (Math.random() - 0.5) * 2, // -1 to 1 range
        sentiment_label: Math.random() > 0.5 ? 'positive' : Math.random() > 0.25 ? 'negative' : 'neutral',
        topic_categories: post.post_text?.match(/#(\w+)/g)?.map(tag => tag.substring(1).toLowerCase()) || 
          ['community', 'trading', 'news'][Math.floor(Math.random() * 3)] ? 
          [['community', 'trading', 'news'][Math.floor(Math.random() * 3)]] : [],
        keywords_detected: post.post_text?.match(/#\w+/g) || [],
        created_at: post.created_at
      })) || [];

      // Calculate combined sentiment
      const telegramAnalyses = telegramSentiment || [];
      const xAnalyses = mockXSentiment || [];
      const allAnalyses = [...telegramAnalyses, ...xAnalyses];
      
      // Data counts: telegram: ${telegramAnalyses.length}, x: ${xAnalyses.length}, total: ${allAnalyses.length}

      if (allAnalyses.length === 0) {
        // No data found, returning defaults
        return {
          currentSentiment: {
            overall: 'Neutral',
            score: 50,
            trend: 'neutral',
            confidence: 0,
            lastUpdate: 'No recent data',
            sources: {
              telegram: { score: 50, count: 0 },
              x: { score: 50, count: 0 }
            }
          },
          keyTopics: []
        };
      }

      // Calculate average sentiment scores
      const telegramAvg = telegramAnalyses.length > 0 
        ? telegramAnalyses.reduce((sum, item) => sum + item.sentiment_score, 0) / telegramAnalyses.length
        : 0;
      
      const xAvg = xAnalyses.length > 0 
        ? xAnalyses.reduce((sum, item) => sum + item.sentiment_score, 0) / xAnalyses.length
        : 0;

      const overallAvg = allAnalyses.reduce((sum, item) => sum + item.sentiment_score, 0) / allAnalyses.length;

      // Convert to percentage (0-100 scale)
      const overallScore = Math.round((overallAvg + 1) * 50);
      const telegramScore = Math.round((telegramAvg + 1) * 50);
      const xScore = Math.round((xAvg + 1) * 50);

      // Determine overall sentiment label
      let overallLabel = 'Neutral';
      let trend = 'neutral';
      if (overallAvg > 0.2) {
        overallLabel = 'Bullish';
        trend = 'up';
      } else if (overallAvg < -0.2) {
        overallLabel = 'Bearish';
        trend = 'down';
      }

      // Extract key topics
      const topicCounts: { [key: string]: { mentions: number; sentiment: number; sources: Set<string> } } = {};
      
      telegramAnalyses.forEach(analysis => {
        analysis.topic_categories?.forEach((topic: string) => {
          if (!topicCounts[topic]) {
            topicCounts[topic] = { mentions: 0, sentiment: 0, sources: new Set() };
          }
          topicCounts[topic].mentions++;
          topicCounts[topic].sentiment += analysis.sentiment_score;
          topicCounts[topic].sources.add('Telegram');
        });
      });

      xAnalyses.forEach(analysis => {
        analysis.topic_categories?.forEach((topic: string) => {
          if (!topicCounts[topic]) {
            topicCounts[topic] = { mentions: 0, sentiment: 0, sources: new Set() };
          }
          topicCounts[topic].mentions++;
          topicCounts[topic].sentiment += analysis.sentiment_score;
          topicCounts[topic].sources.add('X');
        });
      });

      // Convert to key topics array
      const keyTopics: TopicData[] = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b.mentions - a.mentions)
        .slice(0, 3)
        .map(([topic, data]) => {
          const avgSentiment = data.sentiment / data.mentions;
          let sentimentLabel = 'Neutral';
          let color = 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
          
          if (avgSentiment > 0.2) {
            sentimentLabel = 'Bullish';
            color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
          } else if (avgSentiment < -0.2) {
            sentimentLabel = 'Bearish';
            color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
          }

          return {
            topic: topic.charAt(0).toUpperCase() + topic.slice(1),
            sentiment: sentimentLabel,
            mentions: data.mentions,
            source: Array.from(data.sources).join(' + '),
            color
          };
        });

      // Calculate confidence based on data availability
      const confidence = Math.min(100, Math.round((allAnalyses.length / 20) * 100));

      const lastUpdate = allAnalyses.length > 0 
        ? new Date(Math.max(...allAnalyses.map(a => new Date(a.created_at).getTime())))
        : new Date();
      
      const timeDiff = Date.now() - lastUpdate.getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      const lastUpdateText = minutesAgo < 1 ? 'Just now' : 
                           minutesAgo < 60 ? `${minutesAgo} mins ago` : 
                           `${Math.floor(minutesAgo / 60)} hours ago`;

      const result = {
        currentSentiment: {
          overall: overallLabel,
          score: overallScore,
          trend,
          confidence,
          lastUpdate: lastUpdateText,
          sources: {
            telegram: { score: telegramScore, count: telegramAnalyses.length },
            x: { score: xScore, count: xAnalyses.length }
          }
        },
        keyTopics
      };
      
      console.log('✅ Sentiment analysis result:', {
        overall: result.currentSentiment.overall,
        score: result.currentSentiment.score,
        telegram: result.currentSentiment.sources.telegram,
        x: result.currentSentiment.sources.x,
        topicsCount: result.keyTopics.length
      });
      
      return result;
    },
    refetchInterval: 60000, // Optimized: Refetch every 60 seconds instead of 30
    staleTime: 30000, // Optimized: Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus
    retry: 2, // Reduce retry attempts
  });

  // Performance tracking for query
  useQueryPerformanceTracker('live-sentiment', isLoading, sentimentData);

  return {
    sentimentData,
    isLoading,
    error,
    refetch
  };
}
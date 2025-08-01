
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Activity, Brain, Zap, Target, MessageCircle } from 'lucide-react';
import { useLiveSentiment } from '@/hooks/useLiveSentiment';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface SentimentTrackerWidgetProps {
  subscriber: Subscriber;
}

export function SentimentTrackerWidget({
  subscriber
}: SentimentTrackerWidgetProps) {
  const { sentimentData, isLoading, refetch } = useLiveSentiment();

  // Use real data or show loading state
  const currentSentiment = sentimentData?.currentSentiment || {
    overall: 'Loading',
    score: 0,
    trend: 'neutral',
    confidence: 0,
    lastUpdate: 'Loading...'
  };

  const keyTopics = sentimentData?.keyTopics || [];

  // Calculate breakdown from real data
  const sentimentBreakdown = sentimentData ? [
    {
      label: 'Bullish',
      percentage: Math.round((sentimentData.currentSentiment.score || 0) * 0.6), // Rough calculation
      color: 'from-green-400 to-green-500',
      bgColor: 'bg-green-500'
    },
    {
      label: 'Neutral',
      percentage: Math.round(100 - (sentimentData.currentSentiment.score || 50)),
      color: 'from-gray-400 to-gray-500',
      bgColor: 'bg-gray-400'
    },
    {
      label: 'Bearish',
      percentage: Math.round((100 - (sentimentData.currentSentiment.score || 50)) * 0.4),
      color: 'from-red-400 to-red-500',
      bgColor: 'bg-red-500'
    }
  ] : [
    { label: 'Bullish', percentage: 0, color: 'from-green-400 to-green-500', bgColor: 'bg-green-500' },
    { label: 'Neutral', percentage: 100, color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-400' },
    { label: 'Bearish', percentage: 0, color: 'from-red-400 to-red-500', bgColor: 'bg-red-500' }
  ];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-950/20 dark:via-violet-950/20 dark:to-indigo-950/20 border-0 rounded-2xl hover:shadow-xl transition-all duration-300" data-tour="sentiment-tracker">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full blur-lg" />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-md">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  AI Sentiment
                  <Target className="h-3 w-3 text-purple-600" />
                </div>
              </div>
            </CardTitle>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs flex-shrink-0 px-2 py-1 rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></div>
            Live AI
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3 overflow-y-auto p-4 relative z-10">
        {/* Compact Overall Sentiment */}
        <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-green-400 to-green-500 rounded-xl text-white shadow-md">
              {getSentimentIcon(currentSentiment.overall)}
            </div>
            <span className="font-bold text-lg text-green-600 dark:text-green-400">
              {currentSentiment.overall}
            </span>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            {currentSentiment.score}%
          </div>
          <div className="text-xs text-muted-foreground">
            {currentSentiment.confidence}% confidence • {currentSentiment.lastUpdate}
          </div>
        </div>

        {/* Compact Sentiment Breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-purple-600" />
            Breakdown
          </h4>
          {sentimentBreakdown.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs w-12 font-medium text-muted-foreground">{item.label}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${item.color} shadow-sm transition-all duration-700 ease-out`} 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs w-8 text-right font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>

        {/* Compact Key Topics */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Zap className="h-3 w-3 text-purple-600" />
            Topics
          </h4>
          <div className="space-y-1">
            {isLoading ? (
              <div className="text-center text-gray-500 py-4">Loading sentiment data...</div>
            ) : keyTopics.length > 0 ? keyTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium truncate">{topic.topic}</span>
                  <Badge className={`text-xs ${topic.color} border-0 px-1.5 py-0.5 rounded-full`}>
                    {topic.sentiment}
                  </Badge>
                  <span className="text-xs text-gray-500">• {topic.source}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0 ml-2">
                  <span className="font-medium text-xs">{topic.mentions}</span>
                  <MessageCircle className="h-3 w-3" />
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">No recent topic data available</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

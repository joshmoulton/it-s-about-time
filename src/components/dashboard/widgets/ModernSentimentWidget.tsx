import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Brain, MessageCircle, RefreshCw } from 'lucide-react';
import { useLiveSentiment } from '@/hooks/useLiveSentiment';
interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}
interface ModernSentimentWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}
export function ModernSentimentWidget({
  subscriber,
  hideHeader = false
}: ModernSentimentWidgetProps) {
  const {
    sentimentData,
    isLoading,
    refetch
  } = useLiveSentiment();

  // Use live data or fallback to placeholder
  const currentSentiment = sentimentData?.currentSentiment || {
    overall: 'Bullish',
    score: 72,
    trend: 'positive',
    confidence: 85,
    lastUpdate: '2 min ago',
    sources: {
      telegram: {
        score: 75,
        count: 245
      },
      x: {
        score: 68,
        count: 127
      }
    }
  };
  const keyTopics = sentimentData?.keyTopics || [{
    topic: 'BTC',
    sentiment: 'Bullish',
    mentions: 45,
    color: 'text-green-400',
    source: 'telegram'
  }, {
    topic: 'ETH',
    sentiment: 'Neutral',
    mentions: 28,
    color: 'text-gray-400',
    source: 'telegram'
  }];
  return <ModernCard interactive className="h-full flex flex-col bg-gradient-to-br from-purple-900/20 via-violet-900/10 to-slate-800/50 border-purple-500/20 hover:border-purple-400/30 transition-all duration-200 relative" data-tour="sentiment-tracker">
      <Badge className="absolute top-4 right-4 z-10 bg-yellow-600/90 text-yellow-50 text-xs px-2 py-1 rounded-md">
        WIP
      </Badge>
      {!hideHeader && <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center shadow-sm">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <ModernCardTitle className="text-sm text-white">AI Sentiment</ModernCardTitle>
              
            </div>
          </div>
        </ModernCardHeader>}
      
      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        <div className="flex-1 flex flex-col">
          {/* Current Sentiment Score */}
          <div className="text-center flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-emerald-400">{currentSentiment.score}%</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-sm font-medium">{currentSentiment.overall}</span>
            </div>
            <div className="text-purple-300/60 text-xs mt-1">
              {currentSentiment.confidence}% confidence • {currentSentiment.lastUpdate}
            </div>
          </div>

          {/* Key Topics */}
          <div className="space-y-2.5 mt-auto">
            {keyTopics.slice(0, 2).map((topic, index) => <div key={index} className="flex items-center justify-between p-3.5 bg-purple-900/30 rounded-lg border border-purple-500/20 min-h-[60px]">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs">{topic.topic}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${topic.sentiment === 'Bullish' ? 'bg-green-900/30 text-green-400' : topic.sentiment === 'Bearish' ? 'bg-red-900/30 text-red-400' : 'bg-gray-900/30 text-gray-400'}`}>
                    {topic.sentiment}
                  </span>
                </div>
                <span className="text-purple-300/60 text-xs">{topic.mentions} 💬</span>
              </div>)}
          </div>
        </div>

        {/* Temporarily disabled redirect button
         <div className="mt-auto">
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl h-12 text-sm font-medium shadow-sm transition-all duration-200"
            onClick={() => window.location.href = '/sentiment-analysis'}
          >
            <Brain className="h-4 w-4 mr-2 flex-shrink-0" />
            View Full Analysis
          </Button>
         </div>
         */}
      </ModernCardContent>
    </ModernCard>;
}
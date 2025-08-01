import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw } from 'lucide-react';
import { useLiveSentiment } from '@/hooks/useLiveSentiment';
import { SentimentPageSkeleton } from '@/components/loading/SentimentSkeleton';
import { OptimizedSentimentCard } from '@/components/optimized/OptimizedSentimentCard';

// Memoized sentiment icon component for better performance
const SentimentIcon = React.memo<{ trend: string }>(({ trend }) => {
  switch (trend) {
    case 'up': return <TrendingUp className="h-4 w-4" />;
    case 'down': return <TrendingDown className="h-4 w-4" />;
    default: return <Minus className="h-4 w-4" />;
  }
});
SentimentIcon.displayName = 'SentimentIcon';

// Memoized header actions component
const HeaderActions = React.memo<{ 
  isLoading: boolean; 
  onRefresh: () => void; 
  onHistoricalData: () => void; 
}>(({ isLoading, onRefresh, onHistoricalData }) => (
  <div className="flex items-center gap-2">
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onRefresh}
      disabled={isLoading}
      className="text-white border border-slate-700 hover:bg-slate-800"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
    <Button 
      variant="outline" 
      size="sm"
      onClick={onHistoricalData}
      className="text-white border-slate-700 hover:bg-slate-800"
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      Historical Data
    </Button>
  </div>
));
HeaderActions.displayName = 'HeaderActions';

export default function SentimentAnalysis() {
  const navigate = useNavigate();
  const { sentimentData, isLoading, refetch } = useLiveSentiment();

  // Use live data or fallback to loading state
  const currentSentiment = sentimentData?.currentSentiment || {
    overall: 'Loading...',
    score: 0,
    trend: 'neutral',
    confidence: 0,
    lastUpdate: 'Loading...',
    sources: {
      telegram: { score: 0, count: 0 },
      x: { score: 0, count: 0 }
    }
  };

  const keyTopics = sentimentData?.keyTopics || [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-green-500';
      case 'Bearish': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Memoized callbacks for better performance
  const handleRefresh = React.useCallback(() => {
    console.log('Refresh clicked');
    refetch();
  }, [refetch]);

  const handleHistoricalData = React.useCallback(() => {
    console.log('Historical data clicked');
    navigate('/admin/sentiment-analytics');
  }, [navigate]);

  const handleViewTopicDetails = React.useCallback((topic: string) => {
    console.log('View details clicked for topic:', topic);
    navigate(`/sentiment-details?topic=${encodeURIComponent(topic)}`);
  }, [navigate]);

  const handleBackToDashboard = React.useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const totalMessages = React.useMemo(() => 
    currentSentiment.sources.telegram.count + currentSentiment.sources.x.count, 
    [currentSentiment.sources]
  );

  // Show skeleton loading for better UX
  if (isLoading && !sentimentData) {
    return <SentimentPageSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-800 flex-shrink-0 bg-gradient-to-r from-slate-950 to-slate-900">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="text-white border border-slate-700 hover:bg-slate-800 hover:text-white bg-slate-800/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">AI Sentiment Analysis</h1>
                <p className="text-slate-300">Real-time market sentiment from community discussions</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6 text-center">
              <div>
                <div className={`text-3xl font-bold ${getSentimentColor(currentSentiment.overall)}`}>
                  {currentSentiment.score}%
                </div>
                <div className="text-xs text-slate-400">Overall Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{currentSentiment.confidence}%</div>
                <div className="text-xs text-slate-400">Confidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">Live</div>
                <div className="text-xs text-slate-400">Real-time</div>
              </div>
            </div>
            
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
              Live Analysis
            </Badge>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Brain className="h-4 w-4 text-blue-400" />
            <span>
              Analyzing {totalMessages} messages • {currentSentiment.lastUpdate}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <HeaderActions 
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onHistoricalData={handleHistoricalData}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-8 bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Overall Sentiment Card */}
          <ModernCard variant="elevated" className="p-8 bg-slate-900 border-slate-700 hover:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Market Sentiment Overview</h2>
                <p className="text-slate-300">Real-time analysis from Telegram and X (Twitter)</p>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getSentimentColor(currentSentiment.overall)}`}>
                  {currentSentiment.score}%
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge className={`${getSentimentColor(currentSentiment.overall)} border-current/20 bg-current/10`}>
                    <SentimentIcon trend={currentSentiment.trend} />
                    <span className="ml-1">{currentSentiment.overall}</span>
                  </Badge>
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  {currentSentiment.confidence}% confidence • {currentSentiment.lastUpdate}
                </div>
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Data Sources</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-medium">Telegram</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {currentSentiment.sources.telegram.score}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {currentSentiment.sources.telegram.count} messages
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Sentiment Score: {currentSentiment.sources.telegram.score}% {currentSentiment.sources.telegram.score > 60 ? '(Bullish)' : currentSentiment.sources.telegram.score < 40 ? '(Bearish)' : '(Neutral)'}
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-medium">X (Twitter)</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {currentSentiment.sources.x.score}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {currentSentiment.sources.x.count} posts
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Sentiment Score: {currentSentiment.sources.x.score}% {currentSentiment.sources.x.score > 60 ? '(Bullish)' : currentSentiment.sources.x.score < 40 ? '(Bearish)' : '(Neutral)'}
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Key Topics Analysis */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Key Topics & Sentiment</h2>
              <p className="text-slate-300">Most discussed topics with sentiment analysis</p>
            </div>
            
            {keyTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {keyTopics.map((topic, index) => (
                  <OptimizedSentimentCard
                    key={`${topic.topic}-${index}`}
                    topic={topic}
                    onViewDetails={handleViewTopicDetails}
                  />
                ))}
              </div>
            ) : (
              <ModernCard className="p-8 text-center bg-slate-900 border-slate-700">
                <div className="text-slate-400">
                  {isLoading ? 'Loading sentiment data...' : 'No recent topic data available'}
                </div>
              </ModernCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Lock, TrendingUp, TrendingDown, Activity, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveSentiment } from '@/hooks/useLiveSentiment';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface SentimentWidgetProps {
  subscriber: Subscriber;
}


export function SentimentWidget({ subscriber }: SentimentWidgetProps) {
  const navigate = useNavigate();
  const { sentimentData, isLoading } = useLiveSentiment();

  const getTierLevel = (tier: string) => {
    const levels = { free: 0, paid: 1, premium: 2 };
    return levels[tier as keyof typeof levels] || 0;
  };

  const userTierLevel = getTierLevel(subscriber?.subscription_tier || 'free');

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Very Bullish': return 'bg-green-600/20 text-green-700 border-green-600/30';
      case 'Bullish': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'Neutral': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      case 'Bearish': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'Very Bearish': return 'bg-red-600/20 text-red-700 border-red-600/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (userTierLevel < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Sentiment Tracker
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced market sentiment analysis and tracking
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-16 w-16 text-muted-foreground" />
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Access advanced sentiment analysis and market psychology insights with a Premium subscription.
            </p>
            <Button onClick={() => navigate('/pricing')}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Sentiment Tracker
          <Crown className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-muted-foreground mt-2">
          Advanced market sentiment analysis and tracking
        </p>
      </div>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Premium Sentiment Dashboard
          </CardTitle>
          <CardDescription>
            Real-time market psychology and sentiment indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sentimentData ? sentimentData.currentSentiment.score : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Sentiment Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sentimentData ? sentimentData.currentSentiment.confidence : '--'}%
              </div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sentimentData ? sentimentData.currentSentiment.sources.telegram.count : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Telegram Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sentimentData ? sentimentData.currentSentiment.sources.x.count : '--'}
              </div>
              <div className="text-sm text-muted-foreground">X Posts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Key Topics Analysis</h2>
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Loading sentiment data...
              </div>
            </CardContent>
          </Card>
        ) : sentimentData && sentimentData.keyTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentimentData.keyTopics.map((topic, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{topic.topic}</CardTitle>
                    <div className="flex items-center gap-2">
                      {topic.sentiment === 'Bullish' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : topic.sentiment === 'Bearish' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">{topic.mentions} mentions</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sentiment</span>
                      <Badge className={getSentimentColor(topic.sentiment)}>
                        {topic.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Source</span>
                      <span className="text-sm font-medium">{topic.source}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                No recent topic data available
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Sentiment Analysis</CardTitle>
          <CardDescription>
            Live sentiment tracking from community discussions and social media
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start" onClick={() => navigate('/sentiment-analysis')}>
              <Activity className="h-4 w-4 mr-2" />
              View Full Analysis
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Sentiment Trends
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Community Insights
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingDown className="h-4 w-4 mr-2" />
              Alert Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

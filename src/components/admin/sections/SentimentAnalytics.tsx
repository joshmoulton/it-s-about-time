import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SentimentTrend {
  time_period: string;
  avg_sentiment_score: number;
  message_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  dominant_topics: string[];
}

interface SentimentAlert {
  id: string;
  alert_type: string;
  severity: string;
  triggered_at: string;
  avg_sentiment: number;
  message_count: number;
  is_resolved: boolean;
  alert_data: any;
}

interface RecentAnalysis {
  id: string;
  sentiment_score: number;
  sentiment_label: string;
  confidence_score: number;
  emotional_tone: string;
  topic_categories: string[];
  keywords_detected: string[];
  created_at: string;
  telegram_messages: {
    message_text: string;
    username: string;
    first_name: string;
  };
}

export function SentimentAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Fetch sentiment trends
  const { data: sentimentTrends, isLoading: trendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['sentiment-trends', selectedTimeRange],
    queryFn: async () => {
      const hoursBack = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '24h' ? 24 : 168;
      const { data, error } = await supabase
        .from('sentiment_trends')
        .select('*')
        .eq('period_type', 'hourly')
        .gte('time_period', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
        .order('time_period', { ascending: true });

      if (error) throw error;
      return data as SentimentTrend[];
    },
  });

  // Fetch recent alerts
  const { data: sentimentAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['sentiment-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentiment_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SentimentAlert[];
    },
  });

  // Fetch recent analyses
  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['recent-sentiment-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_sentiment_analysis')
        .select(`
          *,
          telegram_messages!inner(
            message_text,
            username,
            first_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as any; // Type assertion for schema mismatch
    },
  });

  // Calculate overall stats
  const overallStats = React.useMemo(() => {
    if (!sentimentTrends?.length) return null;

    const totalMessages = sentimentTrends.reduce((sum, trend) => sum + trend.message_count, 0);
    const avgSentiment = sentimentTrends.reduce((sum, trend) => sum + (trend.avg_sentiment_score * trend.message_count), 0) / totalMessages;
    const totalPositive = sentimentTrends.reduce((sum, trend) => sum + trend.positive_count, 0);
    const totalNegative = sentimentTrends.reduce((sum, trend) => sum + trend.negative_count, 0);
    const totalNeutral = sentimentTrends.reduce((sum, trend) => sum + trend.neutral_count, 0);

    return {
      totalMessages,
      avgSentiment,
      positivePercentage: (totalPositive / totalMessages) * 100,
      negativePercentage: (totalNegative / totalMessages) * 100,
      neutralPercentage: (totalNeutral / totalMessages) * 100,
    };
  }, [sentimentTrends]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-600 dark:text-green-400';
    if (score < -0.2) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getSentimentBadgeColor = (label: string) => {
    switch (label) {
      case 'positive': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'negative': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // Prepare chart data
  const chartData = sentimentTrends?.map(trend => ({
    time: new Date(trend.time_period).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    sentiment: trend.avg_sentiment_score,
    messages: trend.message_count,
    positive: trend.positive_count,
    negative: trend.negative_count,
    neutral: trend.neutral_count,
  })) || [];

  const pieData = overallStats ? [
    { name: 'Positive', value: overallStats.positivePercentage, color: '#10b981' },
    { name: 'Neutral', value: overallStats.neutralPercentage, color: '#f59e0b' },
    { name: 'Negative', value: overallStats.negativePercentage, color: '#ef4444' },
  ] : [];

  return (
    <div className="space-y-6 bg-slate-950 text-white min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Brain className="h-6 w-6 text-purple-400" />
            AI Sentiment Analytics
          </h1>
          <p className="text-slate-400">
            Real-time sentiment analysis from Python bot data collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchTrends()} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['1h', '24h', '7d'].map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
            className={selectedTimeRange === range ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}
          >
            {range === '1h' ? 'Last Hour' : range === '24h' ? 'Last 24 Hours' : 'Last 7 Days'}
          </Button>
        ))}
      </div>

      {/* Overview Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Overall Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(overallStats.avgSentiment)}`}>
                {overallStats.avgSentiment.toFixed(3)}
              </div>
              <Progress 
                value={(overallStats.avgSentiment + 1) * 50} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overallStats.totalMessages.toLocaleString()}</div>
              <p className="text-sm text-slate-400">Analyzed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Positive Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{overallStats.positivePercentage.toFixed(1)}%</div>
              <p className="text-sm text-slate-400">of messages</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">
                {sentimentAlerts?.filter(alert => !alert.is_resolved).length || 0}
              </div>
              <p className="text-sm text-slate-400">Unresolved</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="trends" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sentiment Trends</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Active Alerts</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Recent Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sentiment Over Time</CardTitle>
                <CardDescription className="text-slate-400">
                  Sentiment score trends from Python bot analysis (-1.0 to +1.0)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[-1, 1]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="sentiment" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sentiment Distribution</CardTitle>
                <CardDescription className="text-slate-400">
                  Breakdown of positive, neutral, and negative messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Sentiment Alerts</CardTitle>
              <CardDescription className="text-slate-400">
                Automated alerts for significant sentiment changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sentimentAlerts?.map((alert) => (
                  <div key={alert.id} className="p-4 border border-slate-600 rounded-lg bg-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <span className="font-medium capitalize text-white">{alert.alert_type}</span>
                          <Badge className={getAlertSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {!alert.is_resolved && (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          Sentiment: {alert.avg_sentiment.toFixed(3)} • Messages: {alert.message_count}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(alert.triggered_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {!sentimentAlerts?.length && (
                  <p className="text-center text-slate-400 py-8">
                    No sentiment alerts found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Message Analysis</CardTitle>
              <CardDescription className="text-slate-400">
                Latest sentiment analysis results from Python bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnalyses?.map((analysis) => (
                  <div key={analysis.id} className="p-4 border border-slate-600 rounded-lg bg-slate-700/50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSentimentBadgeColor(analysis.sentiment_label)}>
                          {analysis.sentiment_label}
                        </Badge>
                        <span className={`text-sm font-medium ${getSentimentColor(analysis.sentiment_score)}`}>
                          {analysis.sentiment_score.toFixed(3)}
                        </span>
                        <span className="text-sm text-slate-400">
                          ({(analysis.confidence_score * 100).toFixed(1)}% confidence)
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-300">
                        <strong className="text-white">@{analysis.telegram_messages.username || analysis.telegram_messages.first_name}:</strong>{' '}
                        {analysis.telegram_messages.message_text?.substring(0, 150)}
                        {(analysis.telegram_messages.message_text?.length || 0) > 150 && '...'}
                      </p>
                      
                      {analysis.topic_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {analysis.topic_categories.map((topic, index) => (
                            <Badge key={index} className="bg-slate-600 text-slate-300 border-slate-500 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500">
                        {new Date(analysis.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {!recentAnalyses?.length && (
                  <p className="text-center text-slate-400 py-8">
                    No recent analyses found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
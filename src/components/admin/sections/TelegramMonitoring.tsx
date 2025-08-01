import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Settings, Activity, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function TelegramMonitoring() {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [sentimentThreshold, setSentimentThreshold] = useState(0.7);
  const [externalBotEnabled, setExternalBotEnabled] = useState(true);
  const [pythonBotStatus, setPythonBotStatus] = useState('active');

  // Fetch recent telegram messages
  const { data: recentMessages, isLoading, refetch } = useQuery({
    queryKey: ['telegram-messages-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch sentiment analysis stats
  const { data: sentimentStats } = useQuery({
    queryKey: ['telegram-sentiment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_sentiment_analysis')
        .select('sentiment_label, sentiment_score, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const triggerManualAnalysis = async () => {
    try {
      const response = await supabase.functions.invoke('telegram-sentiment-analyzer', {
        body: {
          batchMode: true,
          messages: recentMessages?.slice(0, 10).map(msg => ({
            id: msg.id,
            message_text: msg.message_text,
            telegram_message_id: (msg as any).telegram_message_id || msg.id
          })) || []
        }
      });

      if (response.error) throw response.error;
      refetch();
    } catch (error) {
      console.error('Error triggering analysis:', error);
    }
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!sentimentStats?.length) return null;

    const positive = sentimentStats.filter(s => s.sentiment_label === 'positive').length;
    const negative = sentimentStats.filter(s => s.sentiment_label === 'negative').length;
    const neutral = sentimentStats.filter(s => s.sentiment_label === 'neutral').length;
    const total = sentimentStats.length;
    const avgSentiment = sentimentStats.reduce((sum, s) => sum + s.sentiment_score, 0) / total;

    return {
      total,
      positive: (positive / total) * 100,
      negative: (negative / total) * 100,
      neutral: (neutral / total) * 100,
      avgSentiment
    };
  }, [sentimentStats]);

  return (
    <div className="space-y-6 bg-slate-950 text-white min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <MessageCircle className="h-6 w-6 text-blue-400" />
            Telegram Monitoring
          </h1>
          <p className="text-slate-400">
            Monitor and analyze Telegram messages in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={triggerManualAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analyze Recent
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Messages Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{recentMessages?.length || 0}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${isMonitoringEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400">
                {isMonitoringEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Avg Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  stats.avgSentiment > 0.2 ? 'text-green-400' : 
                  stats.avgSentiment < -0.2 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {stats.avgSentiment.toFixed(3)}
                </div>
                <p className="text-xs text-slate-400">Last 24h analyzed</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Positive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.positive.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">of messages</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Negative</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{stats.negative.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">of messages</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Settings</TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Recent Messages</TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Analysis Results</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Python Bot Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Configure external Python bot for Telegram monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">External Python Bot</Label>
                  <p className="text-sm text-slate-400">
                    Use external Python service for message collection
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${pythonBotStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {pythonBotStatus === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={externalBotEnabled}
                    onCheckedChange={setExternalBotEnabled}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Legacy Internal Monitoring</Label>
                  <p className="text-sm text-slate-400">
                    Keep internal monitoring as backup (not recommended with Python bot)
                  </p>
                </div>
                <Switch
                  checked={isMonitoringEnabled}
                  onCheckedChange={setIsMonitoringEnabled}
                  disabled={externalBotEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Auto Sentiment Analysis</Label>
                  <p className="text-sm text-slate-400">
                    Automatically analyze sentiment of new messages
                  </p>
                </div>
                <Switch
                  checked={autoAnalysis}
                  onCheckedChange={setAutoAnalysis}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Sentiment Alert Threshold</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={sentimentThreshold}
                  onChange={(e) => setSentimentThreshold(parseFloat(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-sm text-slate-400">
                  Trigger alerts when sentiment changes exceed this threshold
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Messages</CardTitle>
              <CardDescription className="text-slate-400">
                Latest messages from monitored Telegram channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-slate-400 py-8">Loading messages...</p>
              ) : (
                <div className="space-y-4">
                  {recentMessages?.map((message) => (
                    <div key={message.id} className="p-4 border border-slate-700 rounded-lg bg-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              @{(message as any).username || (message as any).first_name || 'Unknown'}
                            </span>
                            {(message as any).topic_name && (
                              <Badge variant="outline" className="border-slate-600 text-slate-300">{(message as any).topic_name}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-300">
                            {message.message_text?.substring(0, 200)}
                            {(message.message_text?.length || 0) > 200 && '...'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date((message as any).created_at || (message as any).message_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!recentMessages?.length && (
                    <p className="text-center text-slate-400 py-8">
                      No recent messages found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Sentiment Analysis Results</CardTitle>
              <CardDescription className="text-slate-400">
                Recent sentiment analysis results from Telegram messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sentimentStats?.slice(0, 10).map((analysis, index) => (
                  <div key={index} className="p-4 border border-slate-700 rounded-lg bg-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            analysis.sentiment_label === 'positive' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : analysis.sentiment_label === 'negative'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }>
                            {analysis.sentiment_label}
                          </Badge>
                          <span className="text-sm font-medium text-white">
                            Score: {analysis.sentiment_score.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(analysis.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {!sentimentStats?.length && (
                  <p className="text-center text-slate-400 py-8">
                    No analysis results found
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
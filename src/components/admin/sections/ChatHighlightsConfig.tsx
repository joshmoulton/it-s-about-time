import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TrendingUp, Brain, Save, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function ChatHighlightsConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [highlightKeywords, setHighlightKeywords] = useState<string[]>([]);
  const [sentimentSources, setSentimentSources] = useState([
    { name: 'Telegram Chat', enabled: true, weight: 70 },
    { name: 'Twitter/X Feed', enabled: false, weight: 30 }
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [config, setConfig] = useState({
    highlightThreshold: 2,
    timeWindowHours: 6,
    maxHighlights: 8,
    sentimentEnabled: true,
    sentimentUpdateInterval: 300000 // 5 minutes
  });

  // Load existing configuration
  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['chat-highlights-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_highlights_config')
        .maybeSingle();
      
      if (error) {
        console.error('Error loading chat highlights config:', error);
        return null;
      }
      
      return data?.setting_value || null;
    }
  });

  // Initialize state from loaded config
  useEffect(() => {
    if (existingConfig) {
      const configData = existingConfig as any;
      if (configData.highlightKeywords) {
        setHighlightKeywords(configData.highlightKeywords);
      } else {
        // Set default keywords if none exist
        setHighlightKeywords([
          '$BTC', 'Bitcoin', '$ETH', 'Ethereum', '$SOL', 'Solana',
          'calls', 'puts', 'options', 'bullish', 'bearish', 'moon',
          'buy', 'sell', 'pump', 'dump', 'long', 'short'
        ]);
      }
      if (configData.sentimentSources) {
        setSentimentSources(configData.sentimentSources);
      }
      if (configData.config) {
        setConfig(configData.config);
      }
    } else {
      // Set default keywords if no config exists
      setHighlightKeywords([
        '$BTC', 'Bitcoin', '$ETH', 'Ethereum', '$SOL', 'Solana',
        'calls', 'puts', 'options', 'bullish', 'bearish', 'moon',
        'buy', 'sell', 'pump', 'dump', 'long', 'short'
      ]);
    }
  }, [existingConfig]);

  const addKeyword = () => {
    if (newKeyword.trim() && !highlightKeywords.includes(newKeyword.trim())) {
      setHighlightKeywords([...highlightKeywords, newKeyword.trim()]);
      setNewKeyword('');
      toast({
        title: "Keyword Added",
        description: `"${newKeyword.trim()}" added to highlight keywords`,
      });
    }
  };

  const removeKeyword = (keyword: string) => {
    setHighlightKeywords(highlightKeywords.filter(k => k !== keyword));
    toast({
      title: "Keyword Removed",
      description: `"${keyword}" removed from highlight keywords`,
    });
  };

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const configData = {
        highlightKeywords,
        sentimentSources,
        config,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'chat_highlights_config',
          setting_value: configData,
          description: 'Chat highlights and sentiment analysis configuration'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-highlights-config'] });
      toast({
        title: "Configuration Saved",
        description: "Chat highlights and sentiment settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Saving Configuration",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const saveConfig = () => {
    saveConfigMutation.mutate();
  };

  return (
    <div className="space-y-6 bg-slate-950 text-white min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chat Highlights & AI Sentiment Configuration</h1>
        <p className="text-slate-400">
          Configure what appears in chat highlights and AI sentiment analysis for Python bot integration
        </p>
      </div>

      <Tabs defaultValue="highlights" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="highlights" className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            Chat Highlights
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            <Brain className="h-4 w-4" />
            AI Sentiment
          </TabsTrigger>
          <TabsTrigger value="python-bot" className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            Python Bot Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="highlights" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Highlight Keywords</CardTitle>
              <CardDescription className="text-slate-400">
                Configure which keywords trigger chat highlights from Python bot data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button onClick={addKeyword} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {highlightKeywords.map((keyword) => (
                  <Badge key={keyword} className="flex items-center gap-1 bg-slate-700 text-slate-300 border-slate-600">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold" className="text-slate-300">Minimum Mentions</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={config.highlightThreshold}
                    onChange={(e) => setConfig({...config, highlightThreshold: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeWindow" className="text-slate-300">Time Window (hours)</Label>
                  <Input
                    id="timeWindow"
                    type="number"
                    value={config.timeWindowHours}
                    onChange={(e) => setConfig({...config, timeWindowHours: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxHighlights" className="text-slate-300">Max Highlights</Label>
                  <Input
                    id="maxHighlights"
                    type="number"
                    value={config.maxHighlights}
                    onChange={(e) => setConfig({...config, maxHighlights: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Sentiment Analysis Sources</CardTitle>
              <CardDescription className="text-slate-400">
                Configure data sources for AI sentiment analysis from Python bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sentimentEnabled" className="text-slate-300">Enable AI Sentiment Analysis</Label>
                <Switch
                  id="sentimentEnabled"
                  checked={config.sentimentEnabled}
                  onCheckedChange={(checked) => setConfig({...config, sentimentEnabled: checked})}
                />
              </div>

              <div className="space-y-3">
                {sentimentSources.map((source, index) => (
                  <div key={source.name} className="flex items-center justify-between p-3 border border-slate-600 rounded-lg bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={(checked) => {
                          const updated = [...sentimentSources];
                          updated[index].enabled = checked;
                          setSentimentSources(updated);
                        }}
                      />
                      <div>
                        <p className="font-medium text-white">{source.name}</p>
                        <p className="text-sm text-slate-400">Weight: {source.weight}%</p>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={source.weight}
                      onChange={(e) => {
                        const updated = [...sentimentSources];
                        updated[index].weight = parseInt(e.target.value) || 0;
                        setSentimentSources(updated);
                      }}
                      className="w-20 bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateInterval" className="text-slate-300">Update Interval (milliseconds)</Label>
                <Input
                  id="updateInterval"
                  type="number"
                  value={config.sentimentUpdateInterval}
                  onChange={(e) => setConfig({...config, sentimentUpdateInterval: parseInt(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-sm text-slate-400">
                  Current: {Math.floor(config.sentimentUpdateInterval / 1000 / 60)} minutes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python-bot" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Python Bot Integration</CardTitle>
              <CardDescription className="text-slate-400">
                Configure external Python bot for enhanced Telegram data collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Bot Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-slate-300">Python bot active and collecting data</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Data Collection Mode</Label>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Real-time streaming
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h4 className="font-medium text-white mb-2">External Bot Configuration</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Your Python bot is handling all Telegram message collection. Internal polling is disabled to prevent conflicts.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Message Processing:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sentiment Analysis:</span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Topic Detection:</span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={saveConfig} 
          size="lg" 
          disabled={saveConfigMutation.isPending || isLoadingConfig}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveConfigMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
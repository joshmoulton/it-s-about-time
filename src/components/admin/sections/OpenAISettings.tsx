import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Settings, TestTube, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function OpenAISettings() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  // Settings state
  const [settings, setSettings] = useState({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 500,
    sentimentPrompt: '',
    autoAnalysis: true,
    batchSize: 10,
    analysisInterval: 30,
    confidenceThreshold: 0.5
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'openai_sentiment_config')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.setting_value && typeof data.setting_value === 'object') {
        setSettings(prev => ({ ...prev, ...data.setting_value as Record<string, any> }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'openai_sentiment_config',
          setting_value: settings,
          description: 'OpenAI sentiment analysis configuration'
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "OpenAI configuration has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await supabase.functions.invoke('telegram-sentiment-analyzer', {
        body: {
          messageText: 'This is a test message to verify OpenAI connectivity.',
          messageId: 'test-connection'
        }
      });

      if (response.error) throw response.error;
      
      setConnectionStatus('connected');
      toast({
        title: "Connection successful",
        description: "OpenAI API is working correctly",
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection failed",
        description: "Unable to connect to OpenAI API",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const runTestAnalysis = async () => {
    setIsTestingConnection(true);
    try {
      const testMessage = "I'm very bullish on SPY calls today! The market sentiment looks extremely positive and I expect huge gains.";
      
      const response = await supabase.functions.invoke('telegram-sentiment-analyzer', {
        body: {
          messageText: testMessage
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Test analysis completed",
        description: `Sentiment: ${response.data.analysis.sentiment_label} (${response.data.analysis.sentiment_score.toFixed(3)})`,
      });
    } catch (error) {
      console.error('Test analysis failed:', error);
      toast({
        title: "Test failed",
        description: "Unable to run sentiment analysis test",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const defaultPrompt = `Analyze the sentiment of this message and return a JSON response with the following structure:
{
  "sentiment_score": (number between -1.0 and 1.0, where -1 is very negative, 0 is neutral, 1 is very positive),
  "sentiment_label": ("positive" | "negative" | "neutral"),
  "confidence_score": (number between 0.0 and 1.0 indicating confidence in the analysis),
  "emotional_tone": (primary emotion: "happy", "angry", "fearful", "excited", "sad", "neutral", "bullish", "bearish", "optimistic", "pessimistic"),
  "topic_categories": (array of relevant categories: ["trading", "crypto", "market", "technical_analysis", "news", "community", "price_action", "strategy"]),
  "keywords_detected": (array of important sentiment-driving words/phrases from the message),
  "analysis_metadata": {
    "reasoning": "brief explanation of the sentiment classification",
    "market_relevance": (0.0 to 1.0 score of how relevant this is to trading/market sentiment)
  }
}

Message to analyze: "{text}"

Important: Only return valid JSON, no other text.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            OpenAI Settings
          </h1>
          <p className="text-muted-foreground">
            Configure OpenAI integration for sentiment analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={
            connectionStatus === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            connectionStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }>
            {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
            {connectionStatus === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'error' ? 'Disconnected' : 'Unknown'}
          </Badge>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={isTestingConnection}>
            {isTestingConnection ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </div>

      <Tabs defaultValue="model" className="space-y-4">
        <TabsList>
          <TabsTrigger value="model">Model Settings</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Configuration</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Configure OpenAI model parameters for sentiment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={settings.model} onValueChange={(value) => setSettings(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (Higher Quality)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  GPT-4o Mini is faster and more cost-effective for sentiment analysis
                </p>
              </div>

              <div className="space-y-2">
                <Label>Temperature: {settings.temperature}</Label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
                <p className="text-sm text-muted-foreground">
                  Lower values make the output more deterministic and consistent
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  min="100"
                  max="1000"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of tokens in the response
                </p>
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.confidenceThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum confidence required to save analysis results
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Engineering</CardTitle>
              <CardDescription>
                Customize the prompt used for sentiment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Custom Sentiment Prompt</Label>
                <Textarea
                  rows={15}
                  value={settings.sentimentPrompt || defaultPrompt}
                  onChange={(e) => setSettings(prev => ({ ...prev, sentimentPrompt: e.target.value }))}
                  placeholder="Enter custom prompt template..."
                />
                <p className="text-sm text-muted-foreground">
                  Use {'{text}'} as a placeholder for the message to analyze. Leave empty to use default prompt.
                </p>
              </div>

              <Button variant="outline" onClick={() => setSettings(prev => ({ ...prev, sentimentPrompt: defaultPrompt }))}>
                Reset to Default Prompt
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure automatic sentiment analysis behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Analysis</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze new messages as they arrive
                  </p>
                </div>
                <Switch
                  checked={settings.autoAnalysis}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAnalysis: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Batch Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.batchSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of messages to process in each batch
                </p>
              </div>

              <div className="space-y-2">
                <Label>Analysis Interval (seconds)</Label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={settings.analysisInterval}
                  onChange={(e) => setSettings(prev => ({ ...prev, analysisInterval: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-muted-foreground">
                  How often to check for new messages to analyze
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing & Diagnostics</CardTitle>
              <CardDescription>
                Test your OpenAI configuration and run diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button onClick={testConnection} disabled={isTestingConnection} className="w-full">
                  {isTestingConnection ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test API Connection
                </Button>

                <Button onClick={runTestAnalysis} disabled={isTestingConnection} variant="outline" className="w-full">
                  {isTestingConnection ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Run Test Analysis
                </Button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-medium mb-2">Test Message</h4>
                <p className="text-sm text-muted-foreground">
                  "I'm very bullish on SPY calls today! The market sentiment looks extremely positive and I expect huge gains."
                </p>
              </div>

              <div className="space-y-2">
                <Label>Expected Results</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sentiment:</span> Positive
                  </div>
                  <div>
                    <span className="font-medium">Score:</span> 0.7-0.9
                  </div>
                  <div>
                    <span className="font-medium">Tone:</span> Bullish/Optimistic
                  </div>
                  <div>
                    <span className="font-medium">Categories:</span> Trading, Market
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadSettings}>
          Reset Changes
        </Button>
        <Button onClick={saveSettings}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
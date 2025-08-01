import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Settings, 
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface XSentimentAnalysis {
  id: string;
  x_post_id: string;
  sentiment_score: number;
  sentiment_label: string;
  confidence_score: number;
  emotional_tone: string;
  keywords_detected: string[];
  topic_categories: string[];
  analysis_metadata: any;
  created_at: string;
  updated_at: string;
  x_posts?: {
    account_handle: string;
    post_text: string;
    posted_at: string;
  };
}

interface SentimentConfig {
  keywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  thresholds: {
    positive_min: number;
    negative_max: number;
    confidence_min: number;
  };
  auto_reprocess: boolean;
  enabled_categories: string[];
}

export function XSentimentManagement() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<XSentimentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingAnalysis, setEditingAnalysis] = useState<XSentimentAnalysis | null>(null);
  const [config, setConfig] = useState<SentimentConfig>({
    keywords: {
      positive: ['bullish', 'moon', 'pump', 'rocket', 'gains', 'profit', 'bull'],
      negative: ['bearish', 'dump', 'crash', 'loss', 'bear', 'decline', 'drop'],
      neutral: ['hold', 'stable', 'sideways', 'range', 'consolidation']
    },
    thresholds: {
      positive_min: 0.3,
      negative_max: -0.3,
      confidence_min: 0.5
    },
    auto_reprocess: false,
    enabled_categories: ['trading', 'market', 'crypto', 'stocks', 'news']
  });
  const [showConfig, setShowConfig] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('x_sentiment_analysis')
        .select(`
          *,
          x_posts!inner (
            account_handle,
            post_text,
            posted_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedSentiment !== 'all') {
        query = query.eq('sentiment_label', selectedSentiment);
      }

      if (selectedCategory !== 'all') {
        query = query.contains('topic_categories', [selectedCategory]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      
      if (searchTerm) {
        filteredData = filteredData.filter(analysis => 
          analysis.x_posts?.post_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analysis.x_posts?.account_handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analysis.keywords_detected?.some(keyword => 
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      setAnalyses(filteredData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sentiment analyses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAnalysis = async (id: string, updates: Partial<XSentimentAnalysis>) => {
    try {
      const { error } = await supabase
        .from('x_sentiment_analysis')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Analysis updated successfully'
      });

      fetchAnalyses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update analysis',
        variant: 'destructive'
      });
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('x_sentiment_analysis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Analysis deleted successfully'
      });

      fetchAnalyses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete analysis',
        variant: 'destructive'
      });
    }
  };

  const reprocessAllAnalyses = async () => {
    try {
      setReprocessing(true);
      const { data, error } = await supabase.functions.invoke('x-sentiment-analyzer', {
        body: { 
          action: 'reprocess_all',
          config: config
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Reprocessed ${data?.processed || 0} analyses`
      });

      fetchAnalyses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reprocess analyses',
        variant: 'destructive'
      });
    } finally {
      setReprocessing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence >= 0.5) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const updateKeywords = (type: keyof typeof config.keywords, keywords: string[]) => {
    setConfig(prev => ({
      ...prev,
      keywords: {
        ...prev.keywords,
        [type]: keywords
      }
    }));
  };

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'x_sentiment_config',
          setting_value: config as any,
          description: 'Configuration for X sentiment analysis'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Configuration saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [selectedSentiment, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">X Sentiment Analysis Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage sentiment analysis for X posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowConfig(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button 
            onClick={reprocessAllAnalyses}
            disabled={reprocessing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${reprocessing ? 'animate-spin' : ''}`} />
            {reprocessing ? 'Reprocessing...' : 'Reprocess All'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analyses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts or accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Sentiment</Label>
                  <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sentiments</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Actions</Label>
                  <Button 
                    variant="outline" 
                    onClick={fetchAnalyses}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results ({analyses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No analyses found matching your criteria
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">@{analysis.x_posts?.account_handle}</span>
                            <Badge variant="outline" className={getSentimentColor(analysis.sentiment_label)}>
                              {getSentimentIcon(analysis.sentiment_label)}
                              {analysis.sentiment_label}
                            </Badge>
                            <Badge variant="outline">
                              {getConfidenceIcon(analysis.confidence_score)}
                              {Math.round(analysis.confidence_score * 100)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {analysis.x_posts?.post_text}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Score: {analysis.sentiment_score.toFixed(2)}</span>
                            <span>Tone: {analysis.emotional_tone}</span>
                            <span>{formatDistanceToNow(new Date(analysis.created_at))} ago</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAnalysis(analysis)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAnalysis(analysis.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {analysis.keywords_detected?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {analysis.keywords_detected.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {analysis.topic_categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {analysis.topic_categories.map((category, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyses.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? Math.round(analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['positive', 'negative', 'neutral'].map((sentiment) => {
                    const count = analyses.filter(a => a.sentiment_label === sentiment).length;
                    const percentage = analyses.length > 0 ? Math.round((count / analyses.length) * 100) : 0;
                    return (
                      <div key={sentiment} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{sentiment}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Analysis Dialog */}
      <Dialog open={!!editingAnalysis} onOpenChange={() => setEditingAnalysis(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sentiment Analysis</DialogTitle>
          </DialogHeader>
          {editingAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sentiment Score</Label>
                  <Input
                    type="number"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={editingAnalysis.sentiment_score}
                    onChange={(e) => setEditingAnalysis({
                      ...editingAnalysis,
                      sentiment_score: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sentiment Label</Label>
                  <Select 
                    value={editingAnalysis.sentiment_label} 
                    onValueChange={(value) => setEditingAnalysis({
                      ...editingAnalysis,
                      sentiment_label: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={editingAnalysis.keywords_detected?.join(', ') || ''}
                  onChange={(e) => setEditingAnalysis({
                    ...editingAnalysis,
                    keywords_detected: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Topic Categories (comma-separated)</Label>
                <Input
                  value={editingAnalysis.topic_categories?.join(', ') || ''}
                  onChange={(e) => setEditingAnalysis({
                    ...editingAnalysis,
                    topic_categories: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  })}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingAnalysis(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  updateAnalysis(editingAnalysis.id, editingAnalysis);
                  setEditingAnalysis(null);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sentiment Analysis Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Keywords Configuration</h3>
              
              {Object.entries(config.keywords).map(([type, keywords]) => (
                <div key={type} className="space-y-2">
                  <Label className="capitalize">{type} Keywords</Label>
                  <Textarea
                    value={keywords.join(', ')}
                    onChange={(e) => updateKeywords(
                      type as keyof typeof config.keywords,
                      e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    )}
                    placeholder={`Enter ${type} keywords separated by commas...`}
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Threshold Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Positive Threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.thresholds.positive_min}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      thresholds: {
                        ...prev.thresholds,
                        positive_min: parseFloat(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Negative Threshold</Label>
                  <Input
                    type="number"
                    min="-1"
                    max="0"
                    step="0.1"
                    value={config.thresholds.negative_max}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      thresholds: {
                        ...prev.thresholds,
                        negative_max: parseFloat(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Confidence</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.thresholds.confidence_min}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      thresholds: {
                        ...prev.thresholds,
                        confidence_min: parseFloat(e.target.value)
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-reprocess"
                checked={config.auto_reprocess}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  auto_reprocess: checked
                }))}
              />
              <Label htmlFor="auto-reprocess">
                Auto-reprocess when configuration changes
              </Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                saveConfig();
                setShowConfig(false);
              }}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
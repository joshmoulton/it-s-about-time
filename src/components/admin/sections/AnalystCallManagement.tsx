import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Plus, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AnalystPattern {
  id: string;
  pattern_name: string;
  pattern_regex: string;
  extraction_config: any;
  is_active: boolean;
  priority: number;
  analyst_id: string;
  created_at: string;
}

interface AnalystCallDetection {
  id: string;
  telegram_message_id: string;
  pattern_id: string;
  extracted_data: any;
  confidence_score: number;
  auto_processed: boolean;
  requires_review: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  analyst_signal_id: string | null;
  created_at: string;
}

interface ChannelConfig {
  id: string;
  chat_id: string;
  channel_name: string;
  analyst_id: string;
  is_monitoring_enabled: boolean;
  auto_process_calls: boolean;
  min_confidence_threshold: number;
}

export function AnalystCallManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPattern, setSelectedPattern] = useState<AnalystPattern | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch patterns
  const { data: patterns = [], isLoading: patternsLoading } = useQuery({
    queryKey: ['analyst-call-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyst_call_patterns')
        .select(`
          *,
          analysts(name, display_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch detections
  const { data: detections = [], isLoading: detectionsLoading } = useQuery({
    queryKey: ['analyst-call-detections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyst_call_detections')
        .select(`
          *,
          analyst_call_patterns(pattern_name),
          telegram_messages(message_text, admin_id, message_time)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch channel configs
  const { data: channelConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['analyst-channel-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyst_channel_config')
        .select(`
          *,
          analysts(name, display_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch analysts
  const { data: analysts = [] } = useQuery({
    queryKey: ['analysts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Review detection mutation
  const reviewDetectionMutation = useMutation({
    mutationFn: async ({ detectionId, approved }: { detectionId: string; approved: boolean }) => {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'review_detection',
          detection_id: detectionId,
          approved,
          reviewed_by: 'admin'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyst-call-detections'] });
      toast({
        title: "Detection Reviewed",
        description: "The detection has been processed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to review detection: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Toggle pattern active status
  const togglePatternMutation = useMutation({
    mutationFn: async ({ patternId, isActive }: { patternId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('analyst_call_patterns')
        .update({ is_active: isActive })
        .eq('id', patternId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyst-call-patterns'] });
      toast({
        title: "Pattern Updated",
        description: "Pattern status has been updated successfully.",
      });
    }
  });

  const handleReviewDetection = (detectionId: string, approved: boolean) => {
    reviewDetectionMutation.mutate({ detectionId, approved });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analyst Call Management</h1>
          <p className="text-muted-foreground">Configure pattern detection and monitor analyst calls</p>
        </div>
      </div>

      <Tabs defaultValue="detections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="detections">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Recent Detections
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Target className="w-4 h-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Settings className="w-4 h-4 mr-2" />
            Channel Config
          </TabsTrigger>
        </TabsList>

        {/* Recent Detections Tab */}
        <TabsContent value="detections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Analyst Call Detections</CardTitle>
              <CardDescription>
                Review and approve automatically detected analyst calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : detections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No detections found
                </div>
              ) : (
                <div className="space-y-4">
                  {detections.map((detection: any) => (
                    <div key={detection.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getConfidenceColor(detection.confidence_score)}>
                            {(detection.confidence_score * 100).toFixed(1)}% confidence
                          </Badge>
                          <Badge variant={detection.requires_review ? "destructive" : "secondary"}>
                            {detection.requires_review ? "Needs Review" : "Auto-processed"}
                          </Badge>
                          {detection.analyst_signal_id && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Signal Created
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(detection.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Original Message</Label>
                          <div className="bg-muted rounded p-2 text-sm">
                            {detection.telegram_messages?.message_text || 'No message text'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            By @{detection.telegram_messages?.username || 'unknown'}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Extracted Data</Label>
                          <div className="bg-muted rounded p-2 text-sm space-y-1">
                            {detection.extracted_data.symbol && (
                              <div><strong>Symbol:</strong> {detection.extracted_data.symbol}</div>
                            )}
                            {detection.extracted_data.entry_price && (
                              <div><strong>Entry:</strong> ${detection.extracted_data.entry_price}</div>
                            )}
                            {detection.extracted_data.stop_loss_price && (
                              <div><strong>Stop Loss:</strong> ${detection.extracted_data.stop_loss_price}</div>
                            )}
                            {detection.extracted_data.targets && (
                              <div><strong>Targets:</strong> {detection.extracted_data.targets.join(', ')}</div>
                            )}
                            <div><strong>Direction:</strong> {detection.extracted_data.trade_direction || 'long'}</div>
                          </div>
                        </div>
                      </div>

                      {detection.requires_review && !detection.reviewed_at && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewDetection(detection.id, true)}
                            disabled={reviewDetectionMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve & Send
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewDetection(detection.id, false)}
                            disabled={reviewDetectionMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {detection.reviewed_at && (
                        <div className="text-sm text-muted-foreground">
                          Reviewed on {new Date(detection.reviewed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Detection Patterns</CardTitle>
                <CardDescription>
                  Configure regex patterns for detecting analyst calls
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pattern
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Detection Pattern</DialogTitle>
                    <DialogDescription>
                      Configure a new pattern for detecting analyst calls
                    </DialogDescription>
                  </DialogHeader>
                  <CreatePatternForm 
                    analysts={analysts}
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['analyst-call-patterns'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {patternsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No patterns configured
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern: any) => (
                    <div key={pattern.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{pattern.pattern_name}</h3>
                          <Badge variant={pattern.is_active ? "default" : "secondary"}>
                            {pattern.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            Priority: {pattern.priority}
                          </Badge>
                        </div>
                        <Switch
                          checked={pattern.is_active}
                          onCheckedChange={(checked) => 
                            togglePatternMutation.mutate({ 
                              patternId: pattern.id, 
                              isActive: checked 
                            })
                          }
                        />
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Analyst: {pattern.analysts?.display_name || pattern.analysts?.name || 'Unknown'}
                      </div>
                      
                      <div className="bg-muted rounded p-2 text-sm font-mono">
                        {pattern.pattern_regex}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Config Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Monitoring Configuration</CardTitle>
              <CardDescription>
                Configure which channels to monitor for analyst calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : channelConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No channel configurations found
                </div>
              ) : (
                <div className="space-y-4">
                  {channelConfigs.map((config: any) => (
                    <div key={config.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{config.channel_name || `Chat ID: ${config.chat_id}`}</h3>
                        <Badge variant={config.is_monitoring_enabled ? "default" : "secondary"}>
                          {config.is_monitoring_enabled ? "Monitoring" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Analyst: {config.analysts?.display_name || config.analysts?.name}</div>
                        <div>Auto-process: {config.auto_process_calls ? "Yes" : "No"}</div>
                        <div>Min confidence: {(config.min_confidence_threshold * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreatePatternForm({ analysts, onSuccess }: { analysts: any[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    pattern_name: '',
    pattern_regex: '',
    analyst_id: '',
    priority: 1,
    is_active: true
  });

  const createPatternMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('analyst_call_patterns')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Pattern Created",
        description: "The detection pattern has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create pattern: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatternMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="pattern_name">Pattern Name</Label>
        <Input
          id="pattern_name"
          value={formData.pattern_name}
          onChange={(e) => setFormData({ ...formData, pattern_name: e.target.value })}
          placeholder="e.g., BTC Long Pattern"
          required
        />
      </div>

      <div>
        <Label htmlFor="analyst_id">Analyst</Label>
        <Select value={formData.analyst_id} onValueChange={(value) => setFormData({ ...formData, analyst_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select analyst" />
          </SelectTrigger>
          <SelectContent>
            {analysts.map((analyst) => (
              <SelectItem key={analyst.id} value={analyst.id}>
                {analyst.display_name || analyst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="pattern_regex">Regex Pattern</Label>
        <Textarea
          id="pattern_regex"
          value={formData.pattern_regex}
          onChange={(e) => setFormData({ ...formData, pattern_regex: e.target.value })}
          placeholder="e.g., (?i)\\$(BTC|ETH).*(?:long|buy).*entry.*\\$?([0-9,]+)"
          className="font-mono"
          required
        />
      </div>

      <div>
        <Label htmlFor="priority">Priority (1-10)</Label>
        <Input
          id="priority"
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createPatternMutation.isPending}>
          {createPatternMutation.isPending ? 'Creating...' : 'Create Pattern'}
        </Button>
      </DialogFooter>
    </form>
  );
}
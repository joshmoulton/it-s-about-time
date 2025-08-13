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
  TrendingUp,
  Search
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

// Form component for creating patterns
function CreatePatternForm({ analysts, onSuccess }: { analysts: any[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    pattern_name: '',
    pattern_regex: '',
    analyst_id: '',
    priority: 1,
    extraction_config: '{}',
  });

  const createPatternMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('analyst_call_patterns')
        .insert([{
          ...data,
          extraction_config: JSON.parse(data.extraction_config || '{}'),
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Pattern Created",
        description: "Detection pattern has been created successfully.",
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
        <Label>Pattern Name</Label>
        <Input
          value={formData.pattern_name}
          onChange={(e) => setFormData(prev => ({ ...prev, pattern_name: e.target.value }))}
          placeholder="e.g., Bull Call Pattern"
          required
        />
      </div>

      <div>
        <Label>Analyst</Label>
        <Select value={formData.analyst_id} onValueChange={(value) => setFormData(prev => ({ ...prev, analyst_id: value }))}>
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
        <Label>Regex Pattern</Label>
        <Textarea
          value={formData.pattern_regex}
          onChange={(e) => setFormData(prev => ({ ...prev, pattern_regex: e.target.value }))}
          placeholder="Enter regex pattern for detecting calls"
          className="font-mono text-sm"
          required
        />
      </div>

      <div>
        <Label>Priority (1-10)</Label>
        <Input
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
        />
      </div>

      <div>
        <Label>Extraction Config (JSON)</Label>
        <Textarea
          value={formData.extraction_config}
          onChange={(e) => setFormData(prev => ({ ...prev, extraction_config: e.target.value }))}
          placeholder='{"symbol_group": 1, "entry_group": 2}'
          className="font-mono text-sm"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createPatternMutation.isPending}>
          {createPatternMutation.isPending ? 'Creating...' : 'Create Pattern'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AnalystDetectionManagement() {
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
    <div className="h-full w-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analyst Detection Management</h1>
            <p className="text-muted-foreground">Configure pattern detection and monitor analyst calls from Telegram</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Tabs defaultValue="detections" className="space-y-4">
            <TabsList>
              <TabsTrigger value="detections">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recent Detections
              </TabsTrigger>
              <TabsTrigger value="patterns">
                <Target className="w-4 h-4 mr-2" />
                Detection Patterns
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
                    Review and approve automatically detected analyst calls from Telegram channels
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
                      Configure regex patterns for detecting analyst calls from Telegram messages
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
                    Configure which Telegram channels to monitor for analyst calls
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
                            <div>Min Confidence: {(config.min_confidence_threshold * 100).toFixed(0)}%</div>
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
      </div>
    </div>
  );
}
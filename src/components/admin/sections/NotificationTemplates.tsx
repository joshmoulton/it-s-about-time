import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit2, Copy, Trash2, Mail, MessageSquare, Smartphone, Bell, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  channel: string;
  template_content: string;
  variables: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_TYPES = [
  { value: 'degen_call', label: 'Degen Call Alert' },
  { value: 'newsletter_alert', label: 'Newsletter Alert' },
  { value: 'system_notification', label: 'System Notification' },
  { value: 'general', label: 'General' }
];

const CHANNELS = [
  { value: 'telegram', label: 'Telegram', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Smartphone },
  { value: 'push', label: 'Push Notification', icon: Bell }
];

export function NotificationTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: '',
    channel: '',
    template_content: '',
    variables: '',
    is_active: true,
    is_default: false
  });

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('template_type', { ascending: true })
        .order('channel', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NotificationTemplate[];
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const { error } = await supabase
        .from('notification_templates')
        .insert([{
          ...templateData,
          variables: templateData.variables ? templateData.variables.split(',').map((v: string) => v.trim()) : []
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Template created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create template: ' + error.message);
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: any) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({
          ...templateData,
          variables: templateData.variables ? templateData.variables.split(',').map((v: string) => v.trim()) : []
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Template updated successfully');
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update template: ' + error.message);
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_type: '',
      channel: '',
      template_content: '',
      variables: '',
      is_active: true,
      is_default: false
    });
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      channel: template.channel,
      template_content: template.template_content,
      variables: template.variables.join(', '),
      is_active: template.is_active,
      is_default: template.is_default
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.template_type || !formData.channel || !formData.template_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleDuplicate = (template: NotificationTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      template_type: template.template_type,
      channel: template.channel,
      template_content: template.template_content,
      variables: template.variables.join(', '),
      is_active: true,
      is_default: false
    });
    setIsCreateDialogOpen(true);
  };

  const getChannelIcon = (channel: string) => {
    const channelData = CHANNELS.find(c => c.value === channel);
    return channelData ? channelData.icon : Bell;
  };

  const renderPreview = (template: NotificationTemplate) => {
    // Simple variable replacement for preview
    let preview = template.template_content;
    template.variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const sampleValue = getSampleValue(variable);
      preview = preview.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), sampleValue);
    });
    return preview;
  };

  const getSampleValue = (variable: string): string => {
    const samples: Record<string, string> = {
      market: 'CRYPTO',
      ticker: 'BTC',
      entry_type: 'MARKET',
      trade_direction: 'LONG',
      entry_display: '$65,000',
      stop_loss_display: '$62,000',
      targets_display: '$70,000, $75,000',
      risk_percentage: '5',
      description: 'Strong bullish momentum with potential breakout above resistance.'
    };
    return samples[variable] || `[${variable}]`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Templates</h1>
          <p className="text-muted-foreground">
            Manage templates for alerts across different channels
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Notification Template</DialogTitle>
              <DialogDescription>
                Create a new template for sending notifications across different channels
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Degen Call Alert - Telegram"
                  />
                </div>
                <div>
                  <Label htmlFor="template_type">Template Type *</Label>
                  <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel">Channel *</Label>
                  <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map(channel => (
                        <SelectItem key={channel.value} value={channel.value}>
                          <div className="flex items-center gap-2">
                            <channel.icon className="h-4 w-4" />
                            {channel.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variables">Variables (comma-separated)</Label>
                  <Input
                    id="variables"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="e.g., market, ticker, price"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the template"
                />
              </div>

              <div>
                <Label htmlFor="template_content">Template Content *</Label>
                <Textarea
                  id="template_content"
                  value={formData.template_content}
                  onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                  placeholder="Template content with variables like {{variable_name}}"
                  rows={8}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Default Template</Label>
                </div>
              </div>

              {formData.variables && (
                <Alert>
                  <AlertDescription>
                    <strong>Available variables:</strong> {formData.variables.split(',').map(v => `{{${v.trim()}}}`).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createTemplateMutation.isPending}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="degen_call">Degen Calls</TabsTrigger>
          <TabsTrigger value="newsletter_alert">Newsletters</TabsTrigger>
          <TabsTrigger value="system_notification">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={(id) => deleteTemplateMutation.mutate(id)}
                onPreview={setPreviewTemplate}
                getChannelIcon={getChannelIcon}
              />
            ))}
          </div>
        </TabsContent>

        {TEMPLATE_TYPES.map(type => (
          <TabsContent key={type.value} value={type.value} className="space-y-4">
            <div className="grid gap-4">
              {templates
                .filter(template => template.template_type === type.value)
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={(id) => deleteTemplateMutation.mutate(id)}
                    onPreview={setPreviewTemplate}
                    getChannelIcon={getChannelIcon}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the notification template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Template Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-variables">Variables (comma-separated)</Label>
                <Input
                  id="edit-variables"
                  value={formData.variables}
                  onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Template Content *</Label>
              <Textarea
                id="edit-content"
                value={formData.template_content}
                onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                rows={8}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="edit-default">Default Template</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateTemplateMutation.isPending}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of {previewTemplate?.name} with sample data
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted">
                {previewTemplate.channel === 'email' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderPreview(previewTemplate) }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">{renderPreview(previewTemplate)}</pre>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Variables used:</strong> {previewTemplate.variables.join(', ')}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: NotificationTemplate;
  onEdit: (template: NotificationTemplate) => void;
  onDuplicate: (template: NotificationTemplate) => void;
  onDelete: (id: string) => void;
  onPreview: (template: NotificationTemplate) => void;
  getChannelIcon: (channel: string) => any;
}

function TemplateCard({ template, onEdit, onDuplicate, onDelete, onPreview, getChannelIcon }: TemplateCardProps) {
  const ChannelIcon = getChannelIcon(template.channel);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChannelIcon className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {template.is_default && (
              <Badge variant="secondary">Default</Badge>
            )}
            <Badge variant={template.is_active ? "default" : "secondary"}>
              {template.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="capitalize">{template.template_type.replace('_', ' ')}</span> • 
            <span className="capitalize ml-1">{template.channel}</span> • 
            <span className="ml-1">{template.variables.length} variables</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onPreview(template)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(template)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(template.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
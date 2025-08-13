
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit, Star } from 'lucide-react';
import { useChatHighlightRules, useChatHighlightActions, ChatHighlightRule } from '@/hooks/useChatHighlightRules';

interface ChatHighlightRulesManagerProps {
  isAdmin?: boolean;
}

type RuleType = 'user' | 'keyword' | 'topic' | 'engagement' | 'time' | 'ai_sentiment' | 'ai_importance';

interface RuleConfigMap {
  user: { username?: string; user_id?: string; first_name?: string };
  keyword: { keyword?: string };
  topic: { topic_name?: string };
  engagement: { min_likes?: number };
  time: { start_hour?: number; end_hour?: number };
  ai_sentiment: { sentiment_type?: 'bullish' | 'bearish' | 'neutral'; confidence_threshold?: number };
  ai_importance: { min_importance_score?: number; topic_keywords?: string[] };
}

export function ChatHighlightRulesManager({ isAdmin = false }: ChatHighlightRulesManagerProps) {
  const { data: rules, isLoading } = useChatHighlightRules();
  const { createRule, updateRule, deleteRule, isCreating, isUpdating, isDeleting } = useChatHighlightActions();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ChatHighlightRule | null>(null);
  const [formData, setFormData] = useState<{
    rule_name: string;
    rule_type: RuleType;
    rule_config: RuleConfigMap[RuleType];
    priority: number;
    highlight_color: string;
    highlight_style: string;
  }>({
    rule_name: '',
    rule_type: 'keyword',
    rule_config: {},
    priority: 5,
    highlight_color: '#fbbf24',
    highlight_style: 'background',
  });

  const ruleTypeOptions = [
    { value: 'user' as const, label: 'User-based (Analysts/Callers)' },
    { value: 'keyword' as const, label: 'Keyword-based' },
    { value: 'topic' as const, label: 'Topic-based' },
    { value: 'engagement' as const, label: 'Engagement-based' },
    { value: 'ai_sentiment' as const, label: 'AI Sentiment-based' },
    { value: 'ai_importance' as const, label: 'AI Importance-based' },
  ];

  const priorityLabels = {
    10: 'Critical (Analysts/VIP)',
    9: 'High Priority (Callers)',
    8: 'Important (Verified Users)',
    7: 'Elevated',
    6: 'Above Normal',
    5: 'Normal',
    4: 'Below Normal',
    3: 'Low',
    2: 'Minimal',
    1: 'Background'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRule) {
      updateRule({
        id: editingRule.id,
        ...formData,
        is_active: editingRule.is_active,
      });
      setEditingRule(null);
    } else {
      createRule({
        ...formData,
        is_active: true,
      });
    }
    
    setFormData({
      rule_name: '',
      rule_type: 'keyword',
      rule_config: {},
      priority: 5,
      highlight_color: '#fbbf24',
      highlight_style: 'background',
    });
    setShowCreateForm(false);
  };

  const handleEdit = (rule: ChatHighlightRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type as RuleType,
      rule_config: rule.rule_config,
      priority: rule.priority,
      highlight_color: rule.highlight_color,
      highlight_style: rule.highlight_style,
    });
    setShowCreateForm(true);
  };

  const handleRuleTypeChange = (newType: RuleType) => {
    setFormData(prev => ({
      ...prev,
      rule_type: newType,
      rule_config: {} // Reset config when type changes
    }));
  };

  const updateRuleConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rule_config: { ...prev.rule_config, [key]: value }
    }));
  };

  const renderConfigFields = () => {
    switch (formData.rule_type) {
      case 'user':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username (without @)</Label>
              <Input
                id="username"
                value={(formData.rule_config as RuleConfigMap['user']).username || ''}
                onChange={(e) => updateRuleConfig('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Priority Suggestions:</strong><br/>
                • Analysts/VIP Callers: Priority 9-10<br/>
                • Verified Traders: Priority 7-8<br/>
                • Regular Contributors: Priority 5-6
              </p>
            </div>
          </div>
        );
      case 'keyword':
        return (
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <Input
              id="keyword"
              value={(formData.rule_config as RuleConfigMap['keyword']).keyword || ''}
              onChange={(e) => updateRuleConfig('keyword', e.target.value)}
              placeholder="Enter keyword to highlight"
            />
          </div>
        );
      case 'topic':
        return (
          <div className="space-y-2">
            <Label htmlFor="topic_name">Topic Name</Label>
            <Input
              id="topic_name"
              value={(formData.rule_config as RuleConfigMap['topic']).topic_name || ''}
              onChange={(e) => updateRuleConfig('topic_name', e.target.value)}
              placeholder="Enter topic name"
            />
          </div>
        );
      case 'engagement':
        return (
          <div className="space-y-2">
            <Label htmlFor="min_likes">Minimum Likes</Label>
            <Input
              id="min_likes"
              type="number"
              value={(formData.rule_config as RuleConfigMap['engagement']).min_likes || ''}
              onChange={(e) => updateRuleConfig('min_likes', parseInt(e.target.value) || 0)}
              placeholder="Minimum number of likes"
            />
          </div>
        );
      case 'ai_sentiment':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sentiment_type">Sentiment Type</Label>
              <Select
                value={(formData.rule_config as RuleConfigMap['ai_sentiment']).sentiment_type || 'bullish'}
                onValueChange={(value) => updateRuleConfig('sentiment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullish">Bullish</SelectItem>
                  <SelectItem value="bearish">Bearish</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence_threshold">Confidence Threshold (%)</Label>
              <Input
                id="confidence_threshold"
                type="number"
                min="50"
                max="100"
                value={(formData.rule_config as RuleConfigMap['ai_sentiment']).confidence_threshold || 80}
                onChange={(e) => updateRuleConfig('confidence_threshold', parseInt(e.target.value) || 80)}
                placeholder="Minimum confidence percentage"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Highlights messages where AI detects the specified sentiment with high confidence
              </p>
            </div>
          </div>
        );
      case 'ai_importance':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min_importance_score">Minimum Importance Score</Label>
              <Input
                id="min_importance_score"
                type="number"
                min="1"
                max="10"
                value={(formData.rule_config as RuleConfigMap['ai_importance']).min_importance_score || 7}
                onChange={(e) => updateRuleConfig('min_importance_score', parseInt(e.target.value) || 7)}
                placeholder="AI importance score (1-10)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic_keywords">Topic Keywords (optional)</Label>
              <Input
                id="topic_keywords"
                value={(formData.rule_config as RuleConfigMap['ai_importance']).topic_keywords?.join(', ') || ''}
                onChange={(e) => updateRuleConfig('topic_keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                placeholder="bitcoin, ethereum, trading (comma-separated)"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Highlights messages with high AI-determined importance. Optional keywords filter by topic.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Admin access required to manage highlight rules</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Chat Highlight Rules</h3>
          <p className="text-sm text-muted-foreground">Configure automatic highlighting for chat messages</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit Rule' : 'Create New Highlight Rule'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                    placeholder="Enter rule name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={handleRuleTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {renderConfigFields()}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {value} - {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Higher numbers = higher priority in chat highlights
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight_color">Highlight Color</Label>
                  <Input
                    id="highlight_color"
                    type="color"
                    value={formData.highlight_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, highlight_color: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight_style">Style</Label>
                  <Select
                    value={formData.highlight_style}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, highlight_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="background">Background</SelectItem>
                      <SelectItem value="border">Border</SelectItem>
                      <SelectItem value="text">Text Color</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRule(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {rules?.map((rule) => (
          <Card key={rule.id} className="relative">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{rule.rule_name}</h4>
                    <Badge variant="secondary">{rule.rule_type}</Badge>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rule.priority }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(rule.rule_config).map(([key, value]) => (
                      <span key={key} className="mr-4">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: rule.highlight_color }}
                  />
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => updateRule({ id: rule.id, is_active: checked })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRule(rule.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

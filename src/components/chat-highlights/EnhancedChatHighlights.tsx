import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, BarChart3, MessageSquare } from 'lucide-react';
import { StatsOverview } from './StatsOverview';
import { HighlightCard } from './EnhancedHighlightCard';

interface TopicStats {
  topic_name: string;
  message_count: number;
  last_message: string;
  unique_users: number;
  trending_score: number;
}

interface EnhancedHighlight {
  id: string;
  message_text: string;
  username: string;
  first_name: string;
  timestamp: string;
  topic_name: string;
  rule_name: string;
  highlight_color: string;
  priority_score: number;
  likes_count: number;
  engagement_score: number;
}

export const EnhancedChatHighlights: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'engagement' | 'priority'>('priority');

  // Fetch enhanced highlights with more data
  const { data: highlights, isLoading } = useQuery<EnhancedHighlight[]>({
    queryKey: ['enhanced-highlights', selectedTopic, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('auto_highlights')
        .select(`
          id,
          priority_score,
          assigned_at,
          telegram_messages!inner (
            id,
            message_text,
            username,
            first_name,
            timestamp,
            topic_name,
            likes_count
          ),
          chat_highlight_rules!inner (
            rule_name,
            highlight_color,
            priority
          )
        `)
        .order('priority_score', { ascending: false })
        .limit(50);

      if (selectedTopic !== 'all') {
        query = query.eq('telegram_messages.topic_name', selectedTopic);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        message_text: item.telegram_messages.message_text,
        username: item.telegram_messages.username,
        first_name: item.telegram_messages.first_name,
        timestamp: item.telegram_messages.timestamp,
        topic_name: item.telegram_messages.topic_name,
        rule_name: item.chat_highlight_rules.rule_name,
        highlight_color: item.chat_highlight_rules.highlight_color,
        priority_score: item.priority_score,
        likes_count: item.telegram_messages.likes_count || 0,
        engagement_score: item.priority_score + (item.telegram_messages.likes_count || 0) * 2,
      }));
    },
    staleTime: 30000, // Cache for 30 seconds 
    refetchInterval: 60000, // Reduce to every 1 minute instead of 10 seconds
    refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
  });

  // Memoize filtered and sorted highlights to prevent unnecessary recalculations
  const filteredHighlights = useMemo(() => {
    if (!highlights) return [];
    
    return highlights
      .filter(highlight => 
        searchTerm === '' || 
        highlight.message_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        highlight.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          case 'engagement':
            return b.engagement_score - a.engagement_score;
          case 'priority':
          default:
            return b.priority_score - a.priority_score;
        }
      });
  }, [highlights, searchTerm, sortBy]);

  // Memoize available topics calculation
  const availableTopics = useMemo(() => {
    if (!highlights) return [];
    return Array.from(new Set(highlights.map(h => h.topic_name).filter(Boolean)));
  }, [highlights]);

  // Memoize topic statistics calculation to prevent expensive recalculations
  const topicStats = useMemo(() => {
    if (!highlights) return [];
    
    return highlights.reduce((acc, highlight) => {
      const existing = acc.find(stat => stat.topic_name === highlight.topic_name);
      if (existing) {
        existing.message_count++;
        existing.unique_users_set.add(highlight.username || '');
        existing.unique_users = existing.unique_users_set.size;
      } else {
        const uniqueUsersSet = new Set([highlight.username || '']);
        acc.push({
          topic_name: highlight.topic_name,
          message_count: 1,
          last_message: highlight.timestamp,
          unique_users: uniqueUsersSet.size,
          unique_users_set: uniqueUsersSet,
          trending_score: 1
        });
      }
      return acc;
    }, [] as Array<TopicStats & { unique_users_set: Set<string> }>).map(stat => ({
      topic_name: stat.topic_name,
      message_count: stat.message_count,
      last_message: stat.last_message,
      unique_users: stat.unique_users,
      trending_score: stat.message_count * 0.7 + stat.unique_users * 0.3
    })).sort((a, b) => b.trending_score - a.trending_score);
  }, [highlights]);

  // Memoize unique users count calculation
  const uniqueUsersCount = useMemo(() => {
    if (!highlights) return 0;
    return new Set(highlights.map(h => h.username).filter(Boolean)).size;
  }, [highlights]);

  // Memoize average engagement calculation
  const avgEngagement = useMemo(() => {
    if (!highlights?.length) return 0;
    return Math.round(
      highlights.reduce((sum, h) => sum + h.engagement_score, 0) / highlights.length
    );
  }, [highlights]);

  // Memoize badge color function to prevent recreation on every render
  const getTopicBadgeColor = useCallback((topicName: string) => {
    switch (topicName) {
      case 'Money Glitch': return 'bg-green-500';
      case 'STOCKS & OPTIONS': return 'bg-blue-500';
      case 'FARMING': return 'bg-yellow-500';
      case 'OFF-TOPIC': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatsOverview 
        totalHighlights={highlights?.length || 0}
        activeTopics={availableTopics.length}
        uniqueUsers={uniqueUsersCount}
        avgEngagement={avgEngagement}
      />

      {/* Topic Statistics */}
      {topicStats && topicStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Topic Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicStats.slice(0, 6).map((topic) => (
                <div key={topic.topic_name} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getTopicBadgeColor(topic.topic_name)}>
                      {topic.topic_name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {topic.message_count} msgs
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {topic.unique_users} unique users
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search highlights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {availableTopics.map((topic) => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: 'recent' | 'engagement' | 'priority') => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Highlights List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredHighlights && filteredHighlights.length > 0 ? (
          filteredHighlights.map((highlight) => (
            <HighlightCard 
              key={highlight.id} 
              highlight={highlight} 
              getTopicBadgeColor={getTopicBadgeColor} 
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No highlights found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedTopic !== 'all' 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'Highlights will appear here as messages are analyzed.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
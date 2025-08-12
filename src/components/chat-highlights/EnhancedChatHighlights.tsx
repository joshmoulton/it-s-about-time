import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, BarChart3, MessageSquare } from 'lucide-react';

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
      // First get auto_highlights with their related data
      const { data: autoHighlights, error: autoError } = await supabase
        .from('auto_highlights')
        .select(`
          id,
          priority_score,
          assigned_at,
          telegram_message_id,
          rule_id
        `)
        .order('priority_score', { ascending: false })
        .limit(50);

      if (autoError) {
        console.error('Auto highlights query error:', autoError);
        throw autoError;
      }

      if (!autoHighlights?.length) {
        return [];
      }

      // Get telegram message IDs and rule IDs
      const messageIds = autoHighlights.map(h => h.telegram_message_id).filter(Boolean);
      const ruleIds = autoHighlights.map(h => h.rule_id).filter(Boolean);

      // Fetch telegram messages
      const { data: messages, error: messagesError } = await supabase
        .from('telegram_messages')
        .select('id, message_text, username, first_name, timestamp, topic_name, likes_count')
        .in('id', messageIds);

      if (messagesError) {
        console.error('Telegram messages query error:', messagesError);
        throw messagesError;
      }

      // Fetch highlight rules
      const { data: rules, error: rulesError } = await supabase
        .from('chat_highlight_rules')
        .select('id, rule_name, highlight_color, priority')
        .in('id', ruleIds);

      if (rulesError) {
        console.error('Highlight rules query error:', rulesError);
        throw rulesError;
      }

      // Combine the data
      return autoHighlights.map((item: any) => {
        const message = messages?.find(m => m.id === item.telegram_message_id);
        const rule = rules?.find(r => r.id === item.rule_id);

        return {
          id: item.id,
          message_text: message?.message_text || '',
          username: message?.username || '',
          first_name: message?.first_name || '',
          timestamp: message?.timestamp || '',
          topic_name: message?.topic_name || '',
          rule_name: rule?.rule_name || '',
          highlight_color: rule?.highlight_color || '#fbbf24',
          priority_score: item.priority_score,
          likes_count: message?.likes_count || 0,
          engagement_score: item.priority_score + (message?.likes_count || 0) * 2,
        };
      }).filter(item => item.message_text); // Only include items with valid messages
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

  // Time formatting function
  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  }, []);

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-slate-800/50 border border-purple-500/20 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Chat Highlights</h1>
      </div>

      {/* Topic Activity Overview - Widget Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topicStats.slice(0, 4).map((topic) => (
          <div key={topic.topic_name} className="p-4 bg-purple-900/30 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-white truncate">{topic.topic_name}</span>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-purple-400" />
                <span className="text-sm font-bold text-purple-300">
                  {topic.message_count}
                </span>
              </div>
            </div>
            <div className="text-xs text-purple-200/60">
              {topic.unique_users} unique users
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search - Widget Style */}
      <div className="bg-purple-900/30 rounded-xl border border-purple-500/20 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              <Input
                placeholder="Search highlights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-800/30 border-purple-500/30 text-white placeholder-purple-300/60 focus:border-purple-400"
              />
            </div>
          </div>
          
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-[180px] bg-purple-800/30 border-purple-500/30 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent className="bg-purple-900 border-purple-500/30">
              <SelectItem value="all">All Topics</SelectItem>
              {availableTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: 'recent' | 'engagement' | 'priority') => setSortBy(value)}>
            <SelectTrigger className="w-[150px] bg-purple-800/30 border-purple-500/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-purple-900 border-purple-500/30">
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Highlights List - Compact Card Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-sm text-purple-300/60 mt-2">Analyzing highlights...</p>
          </div>
        ) : filteredHighlights && filteredHighlights.length > 0 ? (
          filteredHighlights.map((highlight) => (
            <div key={highlight.id} className="p-3 bg-purple-900/30 rounded-xl border border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-900/40 transition-all duration-200">
              <div className="space-y-2">
                {/* Header row with user and topic */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {highlight.first_name?.[0] || highlight.username?.[0] || 'U'}
                    </div>
                    <span className="font-medium text-sm text-white truncate">
                      {highlight.username ? `@${highlight.username}` : highlight.first_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {highlight.topic_name && (
                      <Badge 
                        className={`text-xs px-2 py-0.5 ${getTopicBadgeColor(highlight.topic_name)} text-white`}
                      >
                        {highlight.topic_name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Message content */}
                <p className="text-sm text-purple-200/80 leading-relaxed line-clamp-3">
                  {highlight.message_text}
                </p>

                {/* Footer with stats */}
                <div className="flex items-center justify-between text-xs text-purple-300/60">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      <span>Priority: {highlight.priority_score}</span>
                    </div>
                    {highlight.likes_count > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{highlight.likes_count} likes</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-purple-300/60">
                    {formatTimeAgo(highlight.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-purple-900/30 rounded-xl border border-purple-500/20">
            <MessageSquare className="h-12 w-12 mx-auto text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No highlights found</h3>
            <p className="text-purple-300/60">
              {searchTerm || selectedTopic !== 'all' 
                ? 'Try adjusting your filters or search terms.' 
                : 'Highlights will appear here as messages are analyzed.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
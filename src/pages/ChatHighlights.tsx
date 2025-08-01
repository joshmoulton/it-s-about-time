import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Clock, RefreshCw, ArrowLeft, Search, Flame, Hash } from 'lucide-react';
import { useHighlightTopics, useTopicComments, useCreateTopicFromKeywords } from '@/hooks/useHighlightTopics';
import { useChatHighlights } from '@/hooks/useChatHighlights';
import { TopicCard } from '@/components/chat-highlights/TopicCard';
import { CommentThread } from '@/components/chat-highlights/CommentThread';

export default function ChatHighlights() {
  const navigate = useNavigate();
  const { topicSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  
  // Fetch topics and keyword highlights
  const { data: topics = [], isLoading: topicsLoading, refetch: refetchTopics } = useHighlightTopics();
  const { data: keywordHighlights = [] } = useChatHighlights(6);
  const createTopicFromKeywords = useCreateTopicFromKeywords();
  
  // If viewing a specific topic, show the comment thread
  const currentTopic = topics.find(t => t.topic_slug === topicSlug);
  const { 
    data: comments = [], 
    isLoading: commentsLoading 
  } = useTopicComments(currentTopic?.id || '');

  // Filter topics based on search and tab
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = !searchQuery || 
      topic.topic_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keyword_group.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'trending') return matchesSearch && topic.is_trending;
    if (activeTab === 'recent') return matchesSearch;
    return matchesSearch;
  });

  // Auto-create topics from trending keywords
  React.useEffect(() => {
    if (keywordHighlights.length > 0 && topics.length === 0) {
      // Group keywords by sentiment and create topics
      const groupedKeywords = keywordHighlights.reduce((acc, highlight) => {
        const sentiment = highlight.sentiment;
        if (!acc[sentiment]) acc[sentiment] = [];
        acc[sentiment].push(highlight.keyword);
        return acc;
      }, {} as Record<string, string[]>);

      // Create topics for each sentiment group
      Object.entries(groupedKeywords).forEach(([sentiment, keywords]) => {
        if (keywords.length >= 2) {
          createTopicFromKeywords.mutate({
            keywords: keywords.slice(0, 5), // Limit to top 5 keywords
            firstMessageTime: new Date().toISOString()
          });
        }
      });
    }
  }, [keywordHighlights, topics.length, createTopicFromKeywords]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // If viewing a specific topic
  if (topicSlug && currentTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/chat-highlights')}
              className="mb-4 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Button>
            
            {/* Topic Header */}
            <div className="bg-background/50 backdrop-blur-sm rounded-xl border border-border/30 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {currentTopic.is_trending && (
                      <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
                        <Flame className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      <Hash className="h-3 w-3 mr-1" />
                      {currentTopic.keyword_group.slice(0, 3).join(', ')}
                    </Badge>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {currentTopic.topic_title}
                  </h1>
                  
                  {currentTopic.topic_description && (
                    <p className="text-muted-foreground">
                      {currentTopic.topic_description}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {currentTopic.engagement_score}
                  </div>
                  <div className="text-xs text-muted-foreground">Engagement Score</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{currentTopic.message_count} messages</span>
                <span>{comments.length} comments</span>
                <span>Last active {formatTimeAgo(currentTopic.last_activity_at)}</span>
              </div>
            </div>
          </div>

          {/* Comments Thread */}
          <CommentThread
            topicId={currentTopic.id}
            comments={comments}
            isLoading={commentsLoading}
          />
        </div>
      </div>
    );
  }

  // Main topics view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="mb-4 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="h-8 w-8 text-primary" />
                Chat Highlights Discussion
              </h1>
              <p className="text-muted-foreground mt-1">
                Join the conversation on trending topics from our community chat
              </p>
            </div>
            <Button onClick={() => refetchTopics()} disabled={topicsLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${topicsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="trending" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="all">All Topics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Topics Grid */}
        {topicsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ModernCard key={i} className="animate-pulse">
                <ModernCardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </ModernCardContent>
              </ModernCard>
            ))}
          </div>
        ) : filteredTopics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                commentCount={(topic as any).comment_count?.[0]?.count || 0}
                showTrending={activeTab !== 'trending'}
              />
            ))}
          </div>
        ) : (
          <ModernCard className="text-center py-12">
            <ModernCardContent>
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {topics.length === 0 ? 'Building Topics from Chat...' : 'No Topics Found'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {topics.length === 0 
                  ? 'We\'re analyzing chat messages to create discussion topics. Check back in a moment!'
                  : searchQuery 
                    ? 'Try adjusting your search terms or browse all topics.'
                    : 'No topics match your current filter. Try switching to "All Topics".'
                }
              </p>
            </ModernCardContent>
          </ModernCard>
        )}
      </div>
    </div>
  );
}
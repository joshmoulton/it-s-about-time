import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Hash,
  ChevronUp,
  Users,
  Flame
} from 'lucide-react';
import { HighlightTopic } from '@/hooks/useHighlightTopics';
import { useNavigate } from 'react-router-dom';

interface TopicCardProps {
  topic: HighlightTopic;
  commentCount?: number;
  showTrending?: boolean;
  compact?: boolean;
}

export const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  commentCount = 0, 
  showTrending = true,
  compact = false 
}) => {
  const navigate = useNavigate();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const topicTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - topicTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const handleClick = () => {
    navigate(`/chat-highlights/${topic.topic_slug}`);
  };

  if (compact) {
    return (
      <Card 
        className="bg-background/50 backdrop-blur-sm border-border/30 hover:bg-background/70 transition-all duration-200 cursor-pointer hover:shadow-md"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {topic.is_trending && showTrending && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
                    <Flame className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(topic.last_activity_at)}
                </div>
              </div>
              
              <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
                {topic.topic_title}
              </h3>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {topic.message_count} messages
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {commentCount} comments
                </div>
                {topic.engagement_score > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <ChevronUp className="h-3 w-3" />
                    {topic.engagement_score}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-background/50 backdrop-blur-sm border-border/30 hover:bg-background/70 transition-all duration-200 cursor-pointer hover:shadow-lg group"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {topic.is_trending && showTrending && (
                <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
                  <Flame className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                <Hash className="h-3 w-3 mr-1" />
                {topic.keyword_group.slice(0, 2).join(', ')}
                {topic.keyword_group.length > 2 && ` +${topic.keyword_group.length - 2}`}
              </Badge>
            </div>
            
            <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
              {topic.topic_title}
            </CardTitle>
            
            {topic.topic_description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {topic.topic_description}
              </p>
            )}
          </div>
          
          {topic.engagement_score > 0 && (
            <div className="flex flex-col items-center gap-1 ml-4">
              <div className="flex items-center gap-1 text-green-600">
                <ChevronUp className="h-4 w-4" />
                <span className="font-semibold">{topic.engagement_score}</span>
              </div>
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Keywords */}
        {topic.keyword_group.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {topic.keyword_group.slice(0, 5).map((keyword, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                {keyword}
              </Badge>
            ))}
            {topic.keyword_group.length > 5 && (
              <Badge variant="secondary" className="text-xs bg-muted/30">
                +{topic.keyword_group.length - 5} more
              </Badge>
            )}
          </div>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{topic.message_count} messages</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount} comments</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last active {formatTimeAgo(topic.last_activity_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
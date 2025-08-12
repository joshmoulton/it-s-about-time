import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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

interface HighlightCardProps {
  highlight: EnhancedHighlight;
  getTopicBadgeColor: (topicName: string) => string;
}

export const HighlightCard = memo<HighlightCardProps>(({ highlight, getTopicBadgeColor }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge 
              className={getTopicBadgeColor(highlight.topic_name)}
              style={{ backgroundColor: highlight.highlight_color }}
            >
              {highlight.rule_name}
            </Badge>
            <Badge variant="outline" className={getTopicBadgeColor(highlight.topic_name)}>
              {highlight.topic_name}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Priority: {highlight.priority_score}</span>
            {highlight.likes_count > 0 && (
              <span>❤️ {highlight.likes_count}</span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{highlight.message_text}</p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{highlight.first_name}</span>
              {highlight.username && (
                <span>(@{highlight.username})</span>
              )}
            </div>
            <span>{formatDistanceToNow(new Date(highlight.timestamp), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Engagement Score: {highlight.engagement_score}</span>
            <span>•</span>
            <span>Topic: {highlight.topic_name}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

HighlightCard.displayName = 'HighlightCard';
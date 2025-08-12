import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface HighlightCardProps {
  highlight: {
    keyword: string;
    count: number;
    color: string;
    latest_mentions: Array<{
      id: string;
      message_text: string;
      timestamp: string;
      username?: string;
      first_name?: string;
      user_id?: string;
    }>;
  };
  isExpanded: boolean;
  onClick: () => void;
}

export const HighlightCard = memo<HighlightCardProps>(({ highlight, isExpanded, onClick }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium" style={{ color: highlight.color }}>
            {highlight.keyword}
          </h3>
          <p className="text-sm text-muted-foreground">{highlight.count} mentions</p>
        </div>
        <div className="text-2xl">
          {isExpanded ? '−' : '+'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {highlight.latest_mentions.slice(0, 3).map((mention) => (
            <div key={mention.id} className="p-2 bg-muted/50 rounded text-xs">
              <p className="mb-1">{mention.message_text}</p>
              <div className="text-muted-foreground">
                {mention.first_name && <span>{mention.first_name}</span>}
                {mention.username && <span> (@{mention.username})</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
));

HighlightCard.displayName = 'HighlightCard';
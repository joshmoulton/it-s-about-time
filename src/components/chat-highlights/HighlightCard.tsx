import React from 'react';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MessageCircle, Clock, User } from 'lucide-react';

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
  isExpanded?: boolean;
  onClick?: () => void;
}

export function HighlightCard({ highlight, isExpanded = false, onClick }: HighlightCardProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <ModernCard 
      className={`transition-all duration-200 hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''} border-purple-500/20 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-slate-800/50`}
      onClick={onClick}
    >
      <ModernCardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: highlight.color }}
            />
            <h3 className="font-semibold text-lg text-white">
              {highlight.keyword}
            </h3>
          </div>
          <Badge 
            className="flex items-center gap-1"
            style={{ backgroundColor: highlight.color + '20', color: highlight.color }}
          >
            <TrendingUp className="h-3 w-3" />
            {highlight.count} mentions
          </Badge>
        </div>

        {/* Recent Mentions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-purple-300/80">
            <MessageCircle className="h-4 w-4" />
            Recent mentions
          </div>
          
          {highlight.latest_mentions.slice(0, isExpanded ? 5 : 2).map((mention) => (
            <div 
              key={mention.id}
              className="p-3 bg-purple-900/30 rounded-lg border border-purple-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {mention.first_name?.[0] || mention.username?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-white">
                      {mention.username ? `@${mention.username}` : mention.first_name || 'User'}
                    </span>
                    <span className="text-xs text-purple-300/60 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(mention.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-purple-200/80 leading-relaxed">
                    {mention.message_text}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {highlight.latest_mentions.length > 2 && !isExpanded && (
            <div className="text-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="text-sm text-purple-300 hover:text-white transition-colors"
              >
                View {highlight.latest_mentions.length - 2} more mentions
              </button>
            </div>
          )}
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}

import React from 'react';
import {
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowDown, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TopicSelector } from './TopicSelector';

interface LiveChatHeaderProps {
  hasRealData: boolean;
  showTopicFeatures: boolean;
  selectedTopic: string | null;
  onTopicChange: (topicId: string | null) => void;
  autoScrollEnabled: boolean;
  onAutoScrollToggle: (enabled: boolean) => void;
  isLive: boolean;
  lastCleanupTime?: Date | null;
}

export function LiveChatHeader({
  hasRealData,
  showTopicFeatures,
  selectedTopic,
  onTopicChange,
  autoScrollEnabled,
  onAutoScrollToggle,
  isLive,
  lastCleanupTime
}: LiveChatHeaderProps) {
  const formatCleanupTime = (time: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <CardHeader className="flex-shrink-0 relative z-10 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-warning to-brand-warning/80 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-brand-warning to-brand-warning/80 bg-clip-text text-transparent">
              Live Community Chat
            </CardTitle>
            {isLive && (
              <div className="flex items-center gap-1 text-xs text-brand-success">
                <div className="w-2 h-2 bg-brand-success rounded-full animate-pulse"></div>
                LIVE
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastCleanupTime && (
            <Badge variant="secondary" className="text-xs bg-brand-primary/10 text-brand-primary border-brand-primary/20">
              <Trash2 className="h-3 w-3 mr-1" />
              Cleaned {formatCleanupTime(lastCleanupTime)}
            </Badge>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onAutoScrollToggle ? () => onAutoScrollToggle(!autoScrollEnabled) : undefined}
                className={`border-brand-warning/30 hover:bg-brand-warning/10 ${autoScrollEnabled ? 'bg-brand-warning/10 text-brand-warning' : 'text-muted-foreground'}`}
              >
                <ArrowDown className={`h-4 w-4 ${autoScrollEnabled ? 'animate-bounce' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{autoScrollEnabled ? 'Disable' : 'Enable'} auto-scroll</p>
            </TooltipContent>
          </Tooltip>

        </div>
      </div>

      {showTopicFeatures && (
        <div className="mt-4">
          <TopicSelector selectedTopic={selectedTopic} onTopicChange={onTopicChange} />
        </div>
      )}

      {!hasRealData && (
        <div className="mt-3 text-center">
          <Badge variant="secondary" className="bg-brand-warning/10 text-brand-warning border-brand-warning/20">
            Demo Mode - Real messages will appear here once Telegram sync is working
          </Badge>
        </div>
      )}
    </CardHeader>
  );
}

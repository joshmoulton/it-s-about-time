
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, MessageCircle } from 'lucide-react';
import { TierUpgradePrompt } from '../../TierUpgradePrompt';

interface ChatMessage {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  message_text?: string;
  timestamp: string;
  topic_name?: string;
  auto_highlights?: Array<{
    highlight_color: string;
    highlight_style: string;
    rule_name: string;
  }>;
}

interface Subscriber {
  subscription_tier: 'free' | 'paid' | 'premium';
}

interface LimitedChatMessagesProps {
  messages: ChatMessage[];
  subscriber: Subscriber;
  messageLimit: number;
}

export function LimitedChatMessages({ messages, subscriber, messageLimit }: LimitedChatMessagesProps) {
  const limitedMessages = messages.slice(0, messageLimit);
  const hiddenCount = Math.max(0, messages.length - messageLimit);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = (msg: ChatMessage) => {
    if (msg.first_name || msg.last_name) {
      return `${msg.first_name || ''} ${msg.last_name || ''}`.trim();
    }
    return msg.username || 'Anonymous';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Badge */}
      <div className="flex items-center justify-between mb-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Preview Mode - Last {messageLimit} Messages
          </span>
        </div>
        {hiddenCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{hiddenCount} more
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {limitedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent messages to display</p>
            </div>
          ) : (
            limitedMessages.map((message) => (
              <div
                key={message.id}
                className="group p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-primary">
                      {getDisplayName(message)}
                    </span>
                    {message.topic_name && (
                      <Badge variant="outline" className="text-xs opacity-70">
                        {message.topic_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                
                {message.message_text && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {message.message_text}
                  </p>
                )}

                {message.auto_highlights && message.auto_highlights.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.auto_highlights.slice(0, 2).map((highlight, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs opacity-60"
                        style={{ 
                          backgroundColor: `${highlight.highlight_color}20`,
                          borderColor: `${highlight.highlight_color}40`
                        }}
                      >
                        {highlight.rule_name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Upgrade Prompt */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <TierUpgradePrompt 
          subscriber={subscriber}
          feature="Full Chat History & Real-time Updates"
          className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
        />
      </div>
    </div>
  );
}

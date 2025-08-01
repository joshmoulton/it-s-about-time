
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Clock, RefreshCw, ExternalLink, TrendingUp } from 'lucide-react';
import { useChatMessages } from '@/hooks/useChatService';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface ChatHighlightsWidgetProps {
  subscriber: Subscriber;
}

const mockHighlights = [
  {
    id: 'mock-1',
    custom_title: 'Top Signal',
    custom_description: 'Just spotted massive whale activity on $BTC - 2,500 BTC moved to exchanges in the last hour.',
    promoted_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    telegram_messages: {
      id: 'msg-1',
      first_name: 'Alex',
      username: 'cryptotrader_alex',
      message_text: 'Just spotted massive whale activity on $BTC - 2,500 BTC moved to exchanges in the last hour.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      likes_count: 47,
      message_type: 'text'
    }
  },
  {
    id: 'mock-2',
    custom_title: 'Market Analysis',
    custom_description: 'ETH breaking resistance at $2,450. Volume is confirming the breakout.',
    promoted_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    telegram_messages: {
      id: 'msg-2',
      first_name: 'Sarah',
      username: 'eth_analyst',
      message_text: 'ETH breaking resistance at $2,450. Volume is confirming the breakout.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      likes_count: 32,
      message_type: 'text'
    }
  }
];

export function ChatHighlightsWidget({ subscriber }: ChatHighlightsWidgetProps) {
  // Use the existing chat service but rely on unified realtime connection
  const { messages, isLoading: messagesLoading, forceRefresh } = useChatMessages();

  // Convert messages to highlights format - get top messages with auto_highlights
  const realHighlights = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];
    
    return messages
      .filter(msg => msg.auto_highlights && msg.auto_highlights.length > 0)
      .slice(0, 2) // Only show 2 highlights for compact view
      .map(msg => ({
        id: msg.id,
        custom_title: msg.auto_highlights?.[0]?.rule_name || 'Highlighted',
        custom_description: msg.message_text,
        promoted_at: msg.timestamp,
        telegram_messages: {
          id: msg.id,
          first_name: msg.first_name,
          username: msg.username,
          message_text: msg.message_text,
          timestamp: msg.timestamp,
          likes_count: msg.likes_count,
          message_type: msg.message_type
        }
      }));
  }, [messages]);

  const formatAuthorName = (message: any) => {
    if (message.username) return `@${message.username}`;
    return `${message.first_name || 'Unknown'} ${message.last_name || ''}`.trim();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Use real highlights if available, otherwise fall back to mock data
  const displayHighlights = realHighlights.length > 0 ? realHighlights : mockHighlights;
  const hasRealData = realHighlights.length > 0;

  return (
    <Card className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-0 rounded-2xl hover:shadow-xl transition-all duration-300" data-tour="chat-highlights">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-200/30 to-transparent rounded-full blur-xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-lg" />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white shadow-md">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Chat Highlights
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {!hasRealData && (
                    <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs">
                      Demo
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={forceRefresh} 
            disabled={messagesLoading} 
            className="flex-shrink-0 h-8 w-8 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 border border-white/20"
          >
            <RefreshCw className={`h-3 w-3 ${messagesLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-2 overflow-y-auto p-4 relative z-10">
        {messagesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-2">Loading highlights...</p>
          </div>
        ) : (
          <>
            {!hasRealData && (
              <div className="text-center py-1 mb-2">
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs">
                  Demo Mode
                </Badge>
              </div>
            )}
            {displayHighlights.map((highlight) => {
              const message = highlight.telegram_messages;
              return (
                <div key={highlight.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-sm group">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        {message.first_name?.[0] || message.username?.[0] || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-xs block truncate">{formatAuthorName(message)}</span>
                        {highlight.custom_title && (
                          <Badge variant="outline" className="text-xs mt-1 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                            {highlight.custom_title}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(message.timestamp)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 leading-relaxed break-words line-clamp-2">
                    {highlight.custom_description || message.message_text || 'No text content'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      {message.likes_count} likes
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}

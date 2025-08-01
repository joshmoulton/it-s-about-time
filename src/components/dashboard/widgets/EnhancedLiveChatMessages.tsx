
import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ThumbsUp } from 'lucide-react';

interface EnhancedLiveChatMessagesProps {
  messages: any[];
  hasRealData: boolean;  
  selectedTopic: string | null;
  showTopicFeatures: boolean;
  messagesLoading: boolean;
  autoScrollEnabled: boolean;
}

export function EnhancedLiveChatMessages({
  messages,
  hasRealData,  
  selectedTopic,
  showTopicFeatures,
  messagesLoading,
  autoScrollEnabled
}: EnhancedLiveChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Only scroll if we have new messages
    if (messages && messages.length > lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length;
      scrollToBottom();
    }
  }, [messages?.length, autoScrollEnabled]);

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

  const getHighlightStyle = (message: any) => {
    if (!message.auto_highlights || message.auto_highlights.length === 0) return {};
    
    const topHighlight = message.auto_highlights.reduce((prev: any, current: any) => 
      prev.priority_score > current.priority_score ? prev : current
    );
    
    return {
      backgroundColor: topHighlight.highlight_color + '20',
      borderLeft: `3px solid ${topHighlight.highlight_color}`,
    };
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto mb-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 space-y-3 overflow-y-auto mb-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
    >
      {!hasRealData && (
        <div className="text-center py-2 mb-4">
          <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
            Demo Mode - Real messages will appear here once Telegram sync is working
          </Badge>
        </div>
      )}
      
      {selectedTopic && showTopicFeatures && (
        <div className="text-center py-2 mb-4">
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <MessageSquare className="h-3 w-3 mr-1" />
            Viewing filtered topic
          </Badge>
        </div>
      )}
      
      {messages?.slice(0, 20).map((message) => (
        <div 
          key={message.id} 
          className="flex items-start gap-3 group hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl p-3 transition-all duration-200"
          style={getHighlightStyle(message)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
            {message.first_name?.[0] || message.username?.[0] || 'U'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-sm truncate">{formatAuthorName(message)}</span>
              
              {message.topic_name && showTopicFeatures && (
                <Badge variant="secondary" className="text-xs px-1 h-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {message.topic_name}
                </Badge>
              )}
              
              {message.auto_highlights && message.auto_highlights.length > 0 && (
                <Badge variant="outline" className="text-xs px-1 h-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  ⭐ Highlighted
                </Badge>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(message.timestamp)}
              </div>
            </div>
            
            <p className="text-sm break-words leading-relaxed text-gray-700 dark:text-gray-300">
              {message.message_text || 'Media content'}
            </p>
            
            {message.media_url && message.message_type === 'photo' && (
              <img 
                src={message.media_url} 
                alt="Shared" 
                className="mt-2 max-w-32 h-auto rounded-lg object-cover shadow-sm" 
              />
            )}
            
            {message.likes_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <ThumbsUp className="h-3 w-3" />
                {message.likes_count} likes
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

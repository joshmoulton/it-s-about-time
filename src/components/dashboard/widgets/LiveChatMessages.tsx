
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { TelegramMessage } from '@/hooks/useTelegramMessages';

interface LiveChatMessagesProps {
  messages: any[];
  hasRealData: boolean;
  selectedTopic: string | null;
  showTopicFeatures: boolean;
  messagesLoading: boolean;
}

export function LiveChatMessages({
  messages,
  hasRealData,
  selectedTopic,
  showTopicFeatures,
  messagesLoading
}: LiveChatMessagesProps) {
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

  if (messagesLoading) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto mb-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-slate-400 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto mb-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      {!hasRealData && (
        <div className="text-center py-2 mb-4">
          <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-300 border-yellow-700/50">
            Demo Mode - Real messages will appear here once Telegram sync is working
          </Badge>
        </div>
      )}
      {selectedTopic && showTopicFeatures && (
        <div className="text-center py-2 mb-4">
          <Badge variant="outline" className="bg-blue-900/50 text-blue-300 border-blue-700/50">
            <MessageSquare className="h-3 w-3 mr-1" />
            Viewing filtered topic
          </Badge>
        </div>
      )}
      {messages.slice(0, 15).map((message) => (
        <div key={message.id} className="flex items-start gap-3 group hover:bg-slate-800/60 rounded-xl p-3 transition-all duration-200">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
            {message.first_name?.[0] || message.username?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-sm text-white truncate">{formatAuthorName(message)}</span>
              {message.topic_name && showTopicFeatures && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-700/80 text-slate-300 border-slate-600">
                  {message.topic_name}
                </Badge>
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-800/60 px-2 py-1 rounded-full">
                {formatTimeAgo(message.timestamp)}
              </span>
            </div>
            <p className="text-sm break-words leading-relaxed text-slate-200">
              {message.message_text || 'Media content'}
            </p>
            {message.media_url && message.message_type === 'photo' && (
              <img 
                src={message.media_url} 
                alt="Shared" 
                className="mt-2 max-w-20 h-auto rounded-lg object-cover shadow-md border border-slate-600" 
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

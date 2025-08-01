import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Users, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useUnifiedTelegramChat } from '@/hooks/useUnifiedTelegramChat';
import { TopicSelector } from './TopicSelector';
interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}
interface UnifiedChatWidgetProps {
  subscriber: Subscriber;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}
export function UnifiedChatWidget({
  subscriber,
  isExpanded = false,
  onToggleExpanded
}: UnifiedChatWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = isExpanded ? 100 : 15;
  const {
    messages,
    selectedTopic,
    setSelectedTopic,
    isLoading,
    forceRefresh,
    hasRealData,
    availableTopics
  } = useUnifiedTelegramChat(limit);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceRefresh();
    // Minimum 800ms for visible feedback
    setTimeout(() => setIsRefreshing(false), 800);
  };
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
  const showTopicFeatures = true; // Temporarily enabled for testing

  return <Card className={`${isExpanded ? 'h-full' : 'h-96'} flex flex-col overflow-hidden bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200`}>
      
      {/* Header with Topic Selector and Controls */}
      <CardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Live Chat</span>
            </div>
            {showTopicFeatures && <TopicSelector selectedTopic={selectedTopic} onTopicChange={setSelectedTopic} />}
          </div>
          
          <div className="flex items-center gap-2">
            {messages && messages.length > 0 && <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-300 border-blue-500/20">
                {messages.length} messages
              </Badge>}
            {onToggleExpanded && <Button variant="ghost" size="sm" onClick={onToggleExpanded} className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700">
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0">
        <div className="h-full overflow-y-auto space-y-2 px-3 py-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e0 transparent'
      }}>
          {isLoading ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div> : messages && messages.length > 0 ? messages.map(message => <div key={message.id} className="flex items-start gap-2 p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {message.first_name?.[0] || message.username?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                      {formatAuthorName(message)}
                    </span>
                    {message.topic_name && <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hidden sm:inline-flex">
                        {message.topic_name}
                      </Badge>}
                    <div className="flex items-center gap-0.5 text-xs text-gray-500 ml-auto flex-shrink-0">
                      <Clock className="h-2.5 w-2.5 hidden sm:inline" />
                      <span className="text-[10px] sm:text-xs">{formatTimeAgo(message.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight">
                    {message.message_text || 'Media content'}
                  </p>
                  {message.media_url && message.message_type === 'photo' && <img src={message.media_url} alt="Shared" className="mt-1 max-w-16 sm:max-w-24 h-auto rounded object-cover border border-gray-200 dark:border-gray-700" />}
                </div>
              </div>) : <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                💬
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connect to Telegram to see live community discussions</p>
            </div>}
        </div>
      </CardContent>
    </Card>;
}
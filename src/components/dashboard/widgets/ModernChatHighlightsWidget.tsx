import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, ThumbsUp, RefreshCw, TrendingUp } from 'lucide-react';
import { useChatHighlights } from '@/hooks/useChatHighlights';
interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}
interface ModernChatHighlightsWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}
export function ModernChatHighlightsWidget({
  subscriber,
  hideHeader = false
}: ModernChatHighlightsWidgetProps) {
  const {
    data: highlights = [],
    isLoading,
    refetch
  } = useChatHighlights(6); // Last 6 hours

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };
  return <ModernCard interactive className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-slate-800/50 border-purple-500/20 hover:border-purple-400/30 transition-all duration-200 relative" data-tour="chat-highlights">
      <Badge className="absolute top-4 right-4 z-10 bg-yellow-600/90 text-yellow-50 text-xs px-2 py-1 rounded-md">
        WIP
      </Badge>
      {!hideHeader && <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <ModernCardTitle className="text-sm text-white">Chat Highlights</ModernCardTitle>
            </div>
            
          </div>
        </ModernCardHeader>}
      
      {hideHeader && <div className="pb-2 pt-3 flex items-center justify-between flex-shrink-0 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-white font-medium text-sm">Chat Highlights</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-6 w-6 rounded-md hover:bg-purple-800/30 text-purple-300 hover:text-white">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>}
      
      <ModernCardContent className="flex-1 flex flex-col min-h-0 p-0">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-sm text-purple-300/60 mt-2">Analyzing keywords...</p>
            </div> : highlights.length > 0 ? <div className="space-y-3">
              {/* Compact Keywords Grid */}
              <div className="grid grid-cols-2 gap-2">
                {highlights.slice(0, 4).map(highlight => <div key={highlight.keyword} className="p-2.5 bg-purple-900/30 rounded-md border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-white truncate" style={{
                  color: highlight.color
                }}>
                        {highlight.keyword}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <TrendingUp className="h-2.5 w-2.5" style={{
                    color: highlight.color
                  }} />
                        <span className="text-xs font-bold" style={{
                    color: highlight.color
                  }}>
                          {highlight.count}
                        </span>
                      </div>
                    </div>
                  </div>)}
              </div>

              {/* Compact Recent Mentions */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-medium text-purple-300/80">Recent</h4>
                {highlights.slice(0, 2).map(highlight => highlight.latest_mentions.slice(0, 1).map(mention => <div key={mention.id} className="p-3 bg-purple-900/30 rounded-md border border-purple-500/20">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {mention.first_name?.[0] || mention.username?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-medium text-xs text-white truncate">
                              {mention.username ? `@${mention.username}` : mention.first_name}
                            </span>
                            <span className="text-xs text-purple-300/60">{formatTimeAgo(mention.timestamp)}</span>
                            
                          </div>
                          <p className="text-xs text-purple-200/80 leading-tight line-clamp-2">
                            {mention.message_text}
                          </p>
                        </div>
                      </div>
                    </div>))}
              </div>
            </div> : <div className="text-center py-6">
              <p className="text-sm text-purple-300/60">No trending keywords found</p>
            </div>}
        </div>
        
        {/* Temporarily disabled redirect button
         <div className="px-4 pb-4 pt-2">
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 text-sm font-medium shadow-sm transition-all duration-200" 
            onClick={() => window.location.href = '/chat-highlights'}
          >
            <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            View All Highlights
          </Button>
         </div>
         */}
      </ModernCardContent>
    </ModernCard>;
}
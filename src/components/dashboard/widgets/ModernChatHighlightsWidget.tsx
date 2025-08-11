import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, ThumbsUp, RefreshCw, TrendingUp } from 'lucide-react';
import { useChatHighlights } from '@/hooks/useChatHighlights';
import { useAutoHighlightsSummary } from '@/hooks/useAutoHighlightsSummary';
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
    data: fallbackHighlights = [],
    isLoading: isFallbackLoading,
    refetch: refetchFallback
  } = useChatHighlights(24); // Fallback: Last 24 hours

  const {
    data: autoHighlights = [],
    isLoading: isAutoLoading,
    refetch: refetchAuto
  } = useAutoHighlightsSummary(6); // Primary: Auto highlights (6h)


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
          <Button variant="ghost" size="sm" onClick={() => { refetchAuto(); refetchFallback(); }} disabled={isAutoLoading || isFallbackLoading} className="h-6 w-6 rounded-md hover:bg-purple-800/30 text-purple-300 hover:text-white">
            <RefreshCw className={`h-3 w-3 ${(isAutoLoading || isFallbackLoading) ? 'animate-spin' : ''}`} />
          </Button>
        </div>}
      
      <ModernCardContent className="flex-1 flex flex-col min-h-0 p-0">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isAutoLoading && isFallbackLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-sm text-purple-300/60 mt-2">Analyzing highlights...</p>
            </div>
          ) : (() => {
            const dataToShow = (autoHighlights && autoHighlights.length > 0) ? autoHighlights : fallbackHighlights;
            if (!autoHighlights.length && fallbackHighlights.length) {
              console.debug('ModernChatHighlightsWidget: falling back to keyword scanner results');
            }
            return dataToShow && dataToShow.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {dataToShow.slice(0, 4).map((highlight: any) => (
                    <div key={highlight.keyword} className="p-2.5 bg-purple-900/30 rounded-md border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-white truncate" style={{ color: highlight.color }}>
                          {highlight.keyword}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <TrendingUp className="h-2.5 w-2.5" style={{ color: highlight.color }} />
                          <span className="text-xs font-bold" style={{ color: highlight.color }}>
                            {highlight.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-medium text-purple-300/80">Recent</h4>
                  {dataToShow.slice(0, 2).map((highlight: any) =>
                    highlight.latest_mentions.slice(0, 1).map((mention: any) => (
                      <div key={mention.id} className="p-3 bg-purple-900/30 rounded-md border border-purple-500/20">
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-purple-300/60">No trending highlights found</p>
              </div>
            );
          })()}
        </div>
      </ModernCardContent>
    </ModernCard>;
}
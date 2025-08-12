import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, MessageCircle, Sparkles } from 'lucide-react';
import { useChatHighlights } from '@/hooks/useChatHighlights';
import { useAutoHighlightsSummary } from '@/hooks/useAutoHighlightsSummary';

export default function ChatHighlights() {
  const navigate = useNavigate();
  
  // Use the same data sources as the widget
  const {
    data: fallbackHighlights = [],
    isLoading: isFallbackLoading,
    refetch: refetchFallback
  } = useChatHighlights(24); // Last 24 hours fallback

  const {
    data: autoHighlights = [],
    isLoading: isAutoLoading,
    refetch: refetchAuto
  } = useAutoHighlightsSummary(6); // Primary: Auto highlights (6h)

  // Determine which data to show (same logic as widget)
  const highlightsData = useMemo(() => {
    if (autoHighlights && autoHighlights.length > 0) {
      return autoHighlights;
    }
    if (fallbackHighlights && fallbackHighlights.length > 0) {
      console.debug('ChatHighlights page: falling back to keyword scanner results');
      return fallbackHighlights;
    }
    return [];
  }, [autoHighlights, fallbackHighlights]);

  const isLoading = isAutoLoading && isFallbackLoading;

  const handleRefresh = async () => {
    await Promise.all([refetchAuto(), refetchFallback()]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="mb-4 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Chat Highlights
                </h1>
              </div>
              
              <p className="text-muted-foreground">
                Trending topics and important messages from community chat
              </p>
            </div>
            
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Status indicator */}
          {autoHighlights.length === 0 && fallbackHighlights.length > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-200">
                Using keyword analysis data while AI highlights are being processed
              </span>
            </div>
          )}
        </div>

        {/* Simple Highlights Display */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : highlightsData.length > 0 ? (
            highlightsData.map((highlight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: highlight.color }}>
                    {highlight.keyword}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {highlight.count} mentions in recent activity
                  </p>
                  
                  {highlight.latest_mentions?.slice(0, 3).map((mention, idx) => (
                    <div key={mention.id || idx} className="mb-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm mb-2">{mention.message_text}</p>
                      <div className="text-xs text-muted-foreground">
                        {mention.first_name && <span>{mention.first_name}</span>}
                        {mention.username && <span> (@{mention.username})</span>}
                        {mention.timestamp && (
                          <span className="ml-2">
                            {new Date(mention.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No highlights found</h3>
                <p className="text-muted-foreground">
                  Chat highlights will appear here as conversations develop.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
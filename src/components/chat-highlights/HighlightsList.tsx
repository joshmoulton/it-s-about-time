import React, { useState } from 'react';
import { HighlightCard } from './HighlightCard';
import { HighlightFilters, FilterTab, SortOption } from './HighlightFilters';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { MessageCircle, Sparkles } from 'lucide-react';

interface HighlightsListProps {
  highlights: Array<{
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
  }>;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export function HighlightsList({ 
  highlights = [], 
  isLoading = false, 
  title = "Chat Highlights",
  subtitle = "Trending keywords and discussions from the community"
}: HighlightsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('trending');
  const [sortBy, setSortBy] = useState<SortOption>('mentions');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Filter highlights based on search
  const filteredHighlights = highlights.filter(highlight => {
    if (!searchQuery) return true;
    
    const searchTerm = searchQuery.toLowerCase();
    return (
      highlight.keyword.toLowerCase().includes(searchTerm) ||
      highlight.latest_mentions.some(mention => 
        mention.message_text.toLowerCase().includes(searchTerm) ||
        mention.username?.toLowerCase().includes(searchTerm) ||
        mention.first_name?.toLowerCase().includes(searchTerm)
      )
    );
  });

  // Sort highlights
  const sortedHighlights = [...filteredHighlights].sort((a, b) => {
    switch (sortBy) {
      case 'mentions':
        return b.count - a.count;
      case 'recent':
        const aLatest = Math.max(...a.latest_mentions.map(m => new Date(m.timestamp).getTime()));
        const bLatest = Math.max(...b.latest_mentions.map(m => new Date(m.timestamp).getTime()));
        return bLatest - aLatest;
      case 'alphabetical':
        return a.keyword.localeCompare(b.keyword);
      default:
        return 0;
    }
  });

  // Filter by tab (for future use with time-based filtering)
  const finalHighlights = sortedHighlights.filter(highlight => {
    if (activeTab === 'trending') {
      // Show highlights with high activity (more than average)
      const averageCount = highlights.reduce((sum, h) => sum + h.count, 0) / highlights.length;
      return highlight.count > averageCount;
    }
    if (activeTab === 'recent') {
      // Show highlights with recent activity (last 6 hours)
      const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
      return highlight.latest_mentions.some(mention => 
        new Date(mention.timestamp).getTime() > sixHoursAgo
      );
    }
    return true; // 'all'
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <HighlightFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <ModernCard key={i} className="animate-pulse">
              <ModernCardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HighlightFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalCount={highlights.length}
        filteredCount={finalHighlights.length}
      />

      {finalHighlights.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {finalHighlights.map((highlight) => (
            <HighlightCard
              key={highlight.keyword}
              highlight={highlight}
              isExpanded={expandedCard === highlight.keyword}
              onClick={() => setExpandedCard(
                expandedCard === highlight.keyword ? null : highlight.keyword
              )}
            />
          ))}
        </div>
      ) : (
        <ModernCard className="text-center py-12">
          <ModernCardContent>
            {highlights.length === 0 ? (
              <>
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Analyzing Chat Activity
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're processing recent chat messages to identify trending topics and highlights. 
                  Check back in a few minutes!
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Highlights Found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search terms or browse all highlights.'
                    : 'No highlights match your current filter. Try switching to "All" or adjusting your filters.'
                  }
                </p>
              </>
            )}
          </ModernCardContent>
        </ModernCard>
      )}
    </div>
  );
}
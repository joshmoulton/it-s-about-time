import React from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Flame, Clock, Hash, TrendingUp } from 'lucide-react';

export type FilterTab = 'trending' | 'recent' | 'all';
export type SortOption = 'mentions' | 'recent' | 'alphabetical';

interface HighlightFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount?: number;
  filteredCount?: number;
}

export function HighlightFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  totalCount = 0,
  filteredCount = 0
}: HighlightFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search keywords or mentions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>

      {/* Tabs and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Flame className="h-3 w-3" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Hash className="h-3 w-3" />
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex gap-1">
            <Badge 
              variant={sortBy === 'mentions' ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                sortBy === 'mentions' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-300 hover:bg-purple-900/30'
              }`}
              onClick={() => onSortChange('mentions')}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Mentions
            </Badge>
            <Badge 
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                sortBy === 'recent' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-300 hover:bg-purple-900/30'
              }`}
              onClick={() => onSortChange('recent')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Recent
            </Badge>
          </div>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} highlights
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader } from '@/components/ui/enhanced-card';

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {[...Array(5)].map((_, i) => (
        <EnhancedCard key={i} variant="glass">
          <EnhancedCardHeader className="pb-2">
            <div className="h-4 bg-white/20 rounded animate-pulse mb-2" />
            <div className="h-6 bg-white/30 rounded animate-pulse w-16" />
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="h-3 bg-white/20 rounded animate-pulse w-24" />
          </EnhancedCardContent>
        </EnhancedCard>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6 bg-slate-900 min-h-screen">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-white/10 animate-pulse" />
          <div>
            <div className="h-8 bg-white/20 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-white/10 rounded w-64 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <StatsGridSkeleton />

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <EnhancedCard variant="glass" className="h-80">
            <EnhancedCardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-white/20 rounded w-32" />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/10 rounded-xl" />
                  ))}
                </div>
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>
        
        <div className="lg:col-span-2">
          <EnhancedCard variant="glass" className="h-80">
            <EnhancedCardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-white/20 rounded w-40 mb-4" />
                <div className="h-64 bg-white/10 rounded" />
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';

export const SentimentOverviewSkeleton = React.memo(() => (
  <ModernCard variant="elevated" className="p-8 bg-slate-900 border-slate-700">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="text-center space-y-2">
        <Skeleton className="h-16 w-24 mx-auto" />
        <Skeleton className="h-6 w-20 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
    
    <div className="mt-6 pt-6 border-t border-slate-700">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  </ModernCard>
));

SentimentOverviewSkeleton.displayName = 'SentimentOverviewSkeleton';

export const TopicCardSkeleton = React.memo(() => (
  <ModernCard variant="elevated" className="bg-slate-900 border-slate-700">
    <ModernCardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </ModernCardHeader>
    
    <ModernCardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </ModernCardContent>
  </ModernCard>
));

TopicCardSkeleton.displayName = 'TopicCardSkeleton';

export const SentimentPageSkeleton = React.memo(() => (
  <div className="min-h-screen w-full bg-slate-950 text-white">
    {/* Header Skeleton */}
    <div className="px-8 py-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center space-y-1">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="flex-1 overflow-hidden p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <SentimentOverviewSkeleton />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <TopicCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
));

SentimentPageSkeleton.displayName = 'SentimentPageSkeleton';
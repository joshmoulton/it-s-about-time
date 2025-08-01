import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number | boolean | object)[];
  queryFn: () => Promise<T>;
  enableBackground?: boolean;
  enableOffline?: boolean;
  enableBatching?: boolean;
}

// Hook for optimized queries with intelligent caching and batching
export function useOptimizedQuery<T>(options: OptimizedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const requestTimestamp = useRef(Date.now());
  const abortControllerRef = useRef<AbortController>();

  // Create stable query key
  const stableQueryKey = options.queryKey.map(key => 
    typeof key === 'object' ? JSON.stringify(key) : key
  );

  // Enhanced query function with abort signal
  const enhancedQueryFn = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const startTime = performance.now();
      const result = await options.queryFn();
      const endTime = performance.now();
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && (endTime - startTime) > 1000) {
        console.warn(`🐌 Slow query detected: ${stableQueryKey.join('/')} took ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Query cancelled');
      }
      throw error;
    }
  }, [options.queryFn, stableQueryKey]);

  // Enhanced query options
  const enhancedOptions = {
    ...options,
    queryKey: stableQueryKey,
    queryFn: enhancedQueryFn,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes default (renamed from cacheTime)
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    refetchOnReconnect: options.refetchOnReconnect ?? true,
    retry: options.retry ?? 1,
    retryDelay: options.retryDelay ?? ((attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)),
    networkMode: (options.enableOffline ? 'offlineFirst' : 'online') as 'online' | 'offlineFirst' | 'always',
    refetchInterval: options.enableBackground ? 30000 : undefined,
    refetchIntervalInBackground: options.enableBackground ?? false
  };

  const result = useQuery(enhancedOptions);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Prefetch related data if specified
  useEffect(() => {
    if (options.enableBatching && result.data) {
      // Implement intelligent prefetching logic here
      // This could batch related queries or prefetch likely next queries
    }
  }, [result.data, options.enableBatching]);

  return {
    ...result,
    // Add performance metrics
    isStale: result.isStale,
    isFetchedAfterMount: result.isFetchedAfterMount,
    lastUpdated: result.dataUpdatedAt,
    requestTimestamp: requestTimestamp.current,
  };
}

// Hook for batch queries - reduces number of concurrent requests
export function useBatchedQueries<T>(
  queries: OptimizedQueryOptions<T>[],
  batchSize: number = 3
) {
  const queryClient = useQueryClient();
  
  // Split queries into batches
  const batches = queries.reduce((acc, query, index) => {
    const batchIndex = Math.floor(index / batchSize);
    if (!acc[batchIndex]) acc[batchIndex] = [];
    acc[batchIndex].push(query);
    return acc;
  }, [] as OptimizedQueryOptions<T>[][]);

  // Execute batches with delays
  useEffect(() => {
    batches.forEach((batch, batchIndex) => {
      setTimeout(() => {
        batch.forEach(query => {
          queryClient.prefetchQuery({
            queryKey: query.queryKey,
            queryFn: query.queryFn,
            staleTime: query.staleTime ?? 5 * 60 * 1000,
          });
        });
      }, batchIndex * 100); // 100ms delay between batches
    });
  }, [batches, queryClient]);

  return queries.map(query => useOptimizedQuery(query));
}

// Hook for intelligent data prefetching
export function usePrefetchOnIdle(
  prefetchQueries: (() => Promise<void>)[],
  idleTimeout: number = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const scheduleIdlePrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      // Use requestIdleCallback if available
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(async () => {
          for (const prefetch of prefetchQueries) {
            try {
              await prefetch();
            } catch (error) {
              console.warn('Prefetch failed:', error);
            }
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          for (const prefetch of prefetchQueries) {
            try {
              await prefetch();
            } catch (error) {
              console.warn('Prefetch failed:', error);
            }
          }
        }, 0);
      }
    }, idleTimeout);
  }, [prefetchQueries, idleTimeout]);

  useEffect(() => {
    // Schedule prefetch on user idle
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetIdleTimer = () => {
      scheduleIdlePrefetch();
    };

    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Initial schedule
    scheduleIdlePrefetch();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleIdlePrefetch]);
}
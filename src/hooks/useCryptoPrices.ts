import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoPrice {
  ticker: string;
  price_usd: number;
  price_change_24h: number | null;
  last_updated: string;
}

export function useCryptoPrices(tickers: string[] = []) {
  return useQuery<CryptoPrice[]>({
    queryKey: ['crypto-prices', tickers.sort().join(',')],
    queryFn: async () => {
      if (tickers.length === 0) return [];
      
      console.log(`🔍 Fetching crypto prices for: ${tickers.join(', ')}`);
      
      // First try to get cached prices from database
      const { data: cachedPrices, error: cacheError } = await supabase
        .from('crypto_prices')
        .select('ticker, price_usd, price_change_24h, last_updated')
        .in('ticker', tickers.map(t => t.toUpperCase()));
      
      if (cacheError) {
        console.error('Error fetching cached prices:', cacheError);
      }
      
      const now = new Date();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes
      const freshPrices: CryptoPrice[] = [];
      const staleTickers: string[] = [];
      
      // Check which prices are fresh vs stale
      for (const ticker of tickers) {
        const upperTicker = ticker.toUpperCase();
        const cached = cachedPrices?.find(p => p.ticker === upperTicker);
        
        if (cached) {
          const lastUpdated = new Date(cached.last_updated);
          const isStale = (now.getTime() - lastUpdated.getTime()) > staleThreshold;
          
          if (!isStale) {
            freshPrices.push({
              ticker: upperTicker,
              price_usd: Number(cached.price_usd),
              price_change_24h: cached.price_change_24h ? Number(cached.price_change_24h) : null,
              last_updated: cached.last_updated
            });
          } else {
            staleTickers.push(upperTicker);
          }
        } else {
          staleTickers.push(upperTicker);
        }
      }
      
      // Fetch fresh prices for stale/missing tickers
      if (staleTickers.length > 0) {
        try {
          console.log(`📊 Fetching fresh prices for: ${staleTickers.join(', ')}`);
          
          const { data: freshData, error: fetchError } = await supabase.functions.invoke('crypto-pricing', {
            body: { 
              action: 'fetch_prices',
              tickers: staleTickers
            }
          });
          
          if (fetchError) {
            console.error('Error fetching fresh prices:', fetchError);
          } else if (freshData?.prices) {
            freshPrices.push(...freshData.prices);
          }
        } catch (error) {
          console.error('Error calling crypto-pricing function:', error);
        }
      }
      
      return freshPrices;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: tickers.length > 0,
  });
}

export function useSingleCryptoPrice(ticker: string) {
  const { data: prices, ...rest } = useCryptoPrices(ticker ? [ticker] : []);
  
  const price = prices?.[0] || null;
  
  return {
    data: price,
    ...rest
  };
}
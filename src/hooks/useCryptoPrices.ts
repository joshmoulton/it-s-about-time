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
          
          // Make individual calls for each ticker since the function doesn't support batch requests
          const pricePromises = staleTickers.map(async (ticker) => {
            try {
              // Use direct fetch to make GET request with query params
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-pricing?ticker=${ticker}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                console.error(`Failed to fetch price for ${ticker}: ${response.status}`);
                return null;
              }
              
              const data = await response.json();
              
              return {
                ticker: ticker.toUpperCase(),
                price_usd: data.price || 0,
                price_change_24h: data.change24h || null,
                last_updated: data.timestamp || new Date().toISOString()
              };
            } catch (error) {
              console.error(`Error fetching price for ${ticker}:`, error);
              return null;
            }
          });
          
          const results = await Promise.all(pricePromises);
          const validResults = results.filter(result => result !== null) as CryptoPrice[];
          
          if (validResults.length > 0) {
            freshPrices.push(...validResults);
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
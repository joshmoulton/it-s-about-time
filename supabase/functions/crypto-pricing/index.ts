import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CoinGecko API endpoints
const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const COIN_LIST_ENDPOINT = `${COINGECKO_API}/coins/list`
const SIMPLE_PRICE_ENDPOINT = `${COINGECKO_API}/simple/price`

interface CoinGeckoListItem {
  id: string;
  symbol: string;
  name: string;
}

interface PriceData {
  ticker: string;
  price: number;
  price_change_24h: number | null;
  last_updated: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'fetch_prices'
    
    if (action === 'fetch_prices') {
      return await handleFetchPrices(supabase, req)
    } else if (action === 'update_coin_mappings') {
      return await handleUpdateCoinMappings(supabase)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use fetch_prices or update_coin_mappings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('❌ Crypto pricing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleFetchPrices(supabase: any, req: Request) {
  const body = await req.json().catch(() => ({}))
  const tickers = body.tickers || []
  
  if (!Array.isArray(tickers) || tickers.length === 0) {
    // Fetch active tickers from analyst_signals
    const { data: signals, error: signalsError } = await supabase
      .from('analyst_signals')
      .select('ticker')
      .eq('status', 'active')
    
    if (signalsError) {
      console.error('Error fetching active signals:', signalsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch active signals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const activeTickers = [...new Set(signals?.map(s => s.ticker) || [])]
    if (activeTickers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active tickers found', prices: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    tickers.push(...activeTickers)
  }
  
  console.log(`🔍 Fetching prices for tickers: ${tickers.join(', ')}`)
  
  // Get coin mappings from our database
  const { data: mappings, error: mappingsError } = await supabase
    .from('crypto_coin_mappings')
    .select('ticker, coingecko_id')
    .in('ticker', tickers.map(t => t.toUpperCase()))
  
  if (mappingsError) {
    console.error('Error fetching coin mappings:', mappingsError)
  }
  
  const coinIds: string[] = []
  const tickerToCoinId: Record<string, string> = {}
  
  for (const ticker of tickers) {
    const upperTicker = ticker.toUpperCase()
    const mapping = mappings?.find(m => m.ticker === upperTicker)
    
    if (mapping?.coingecko_id) {
      coinIds.push(mapping.coingecko_id)
      tickerToCoinId[upperTicker] = mapping.coingecko_id
    } else {
      // Fallback: try common mappings
      const fallbackId = getCommonCoinMapping(upperTicker)
      if (fallbackId) {
        coinIds.push(fallbackId)
        tickerToCoinId[upperTicker] = fallbackId
      }
    }
  }
  
  if (coinIds.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No valid coin IDs found for tickers', prices: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Fetch prices from CoinGecko
  const priceUrl = `${SIMPLE_PRICE_ENDPOINT}?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
  
  try {
    const response = await fetch(priceUrl)
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const priceData = await response.json()
    console.log('📊 CoinGecko response:', priceData)
    
    // Transform data
    const prices: PriceData[] = []
    const now = new Date().toISOString()
    
    for (const [ticker, coinId] of Object.entries(tickerToCoinId)) {
      const coinPrice = priceData[coinId]
      if (coinPrice && coinPrice.usd) {
        prices.push({
          ticker,
          price: coinPrice.usd,
          price_change_24h: coinPrice.usd_24h_change || null,
          last_updated: now
        })
      }
    }
    
    // Store prices in database
    if (prices.length > 0) {
      const { error: insertError } = await supabase
        .from('crypto_prices')
        .upsert(
          prices.map(p => ({
            ticker: p.ticker,
            price_usd: p.price,
            price_change_24h: p.price_change_24h,
            last_updated: p.last_updated
          })),
          { 
            onConflict: 'ticker',
            ignoreDuplicates: false 
          }
        )
      
      if (insertError) {
        console.error('Error storing prices:', insertError)
      } else {
        console.log(`✅ Stored ${prices.length} price updates`)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        prices,
        cached_count: prices.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (fetchError) {
    console.error('CoinGecko fetch error:', fetchError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch prices from CoinGecko' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleUpdateCoinMappings(supabase: any) {
  console.log('🔄 Updating coin mappings from CoinGecko...')
  
  try {
    const response = await fetch(COIN_LIST_ENDPOINT)
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const coinList: CoinGeckoListItem[] = await response.json()
    console.log(`📊 Retrieved ${coinList.length} coins from CoinGecko`)
    
    // Create mappings for popular/known coins
    const mappings = coinList
      .filter(coin => coin.symbol && coin.id)
      .map(coin => ({
        ticker: coin.symbol.toUpperCase(),
        coingecko_id: coin.id,
        coin_name: coin.name,
        last_updated: new Date().toISOString()
      }))
    
    // Insert in batches to avoid large requests
    const batchSize = 1000
    let insertedCount = 0
    
    for (let i = 0; i < mappings.length; i += batchSize) {
      const batch = mappings.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('crypto_coin_mappings')
        .upsert(batch, { 
          onConflict: 'ticker',
          ignoreDuplicates: true 
        })
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
      } else {
        insertedCount += batch.length
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Updated ${insertedCount} coin mappings`,
        total_coins: coinList.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error updating coin mappings:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update coin mappings' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Common coin ID mappings for popular tokens
function getCommonCoinMapping(ticker: string): string | null {
  const commonMappings: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'SUSHI': 'sushi',
    'CRV': 'curve-dao-token',
    'COMP': 'compound-coin',
    'YFI': 'yearn-finance',
    'SNX': 'havven',
    'MKR': 'maker',
    'PENGU': 'pudgy-penguins',
    'FART': 'fartcoin',
    'BONK': 'bonk',
    'WIF': 'dogwifcoin',
    'PEPE': 'pepe',
    'SHIB': 'shiba-inu',
    'DOGE': 'dogecoin'
  }
  
  return commonMappings[ticker.toUpperCase()] || null
}
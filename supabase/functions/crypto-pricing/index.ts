import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Comprehensive ticker to CoinGecko ID mapping
const TICKER_TO_COINGECKO_ID: Record<string, string> = {
  // Major cryptocurrencies
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'SUSHI': 'sushi',
  'CRV': 'curve-dao-token',
  'YFI': 'yearn-finance',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  'SNX': 'havven',
  'FTM': 'fantom',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'ICP': 'internet-computer',
  'THETA': 'theta-token',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'TRX': 'tron',
  'XLM': 'stellar',
  'XMR': 'monero',
  'AXS': 'axie-infinity',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'ENJ': 'enjincoin',
  'CHZ': 'chiliz',
  'BAT': 'basic-attention-token',
  'ZRX': '0x',
  'OMG': 'omisego',
  'LRC': 'loopring',
  'GRT': 'the-graph',
  'SPELL': 'spell-token',
  'CRO': 'crypto-com-chain',
  'SUI': 'sui',
  
  // Major stablecoins and wrapped tokens
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'DAI': 'dai',
  'FRAX': 'frax',
  'WBTC': 'wrapped-bitcoin',
  'WETH': 'weth',
  'STETH': 'staked-ether',
  
  // Layer 2 and scaling solutions
  'OP': 'optimism',
  'METIS': 'metis-token',
  'LRC': 'loopring',
  'IMX': 'immutable-x',
  'FTT': 'ftx-token',
  'SRM': 'serum',
  'RAY': 'raydium',
  
  // Popular meme/alt coins
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'BONK': 'bonk',
  'WIF': 'dogwifcoin',
  'BOME': 'book-of-meme',
  'MEW': 'cat-in-a-dogs-world',
  'POPCAT': 'popcat',
  'BRETT': 'based-brett',
  'NEIRO': 'neiro-ethereum',
  'MOODENG': 'moo-deng',
  'PNUT': 'peanut-the-squirrel',
  'GOAT': 'goatseus-maximus',
  'ACT': 'act-i-the-ai-prophecy',
  'CHILLGUY': 'just-a-chill-guy',
  'FWOG': 'fwog',
  'GIGACHAD': 'giga-chad',
  'SPX': 'spx6900',
  'WOJAK': 'wojak',
  'APU': 'apu-apustaja',
  'ANDY': 'andy-ethereum',
  'MICHI': 'michi',
  'SLERF': 'slerf',
  'MYRO': 'myro',
  'GIGA': 'gigachad-2',
  'PONKE': 'ponke',
  'TRUMP': 'maga',
  'JESUS': 'jesus-coin',
  'TROLL': 'trollcoin',
  'RIBBIT': 'ribbit',
  'RETARDIO': 'retardio',
  'Based': 'based-money',
  'TREMP': 'doland-tremp',
  'MAGAA': 'make-america-great-again',
  'NORMIE': 'normie',
  'WSBC': 'wall-street-baby',
  'CHONKY': 'chonky-coin',
  'MOG': 'mog-coin',
  'LADYS': 'milady-meme-coin',
  'TURBO': 'turbo',
  'SPONGE': 'spongebob',
  'KISHU': 'kishu-inu',
  'ELON': 'dogelon-mars',
  'AKITA': 'akita-inu',
  'HOKK': 'hokkaidu-inu',
  'HOGE': 'hoge-finance',
  'SAFEMOON': 'safemoon',
  'BABYDOGE': 'baby-doge-coin',
  'FART': 'fartcoin',
  
  // Solana ecosystem
  'JUP': 'jupiter-exchange-solana',
  'JTO': 'jito-governance-token',
  'ORCA': 'orca',
  'DRIFT': 'drift-protocol',
  'MNGO': 'mango-markets',
  'SBR': 'saber',
  'ATLAS': 'star-atlas',
  'POLIS': 'star-atlas-dao',
  'COPE': 'cope',
  'FIDA': 'bonfida',
  'MEDIA': 'media-network',
  'ROPE': 'rope-token',
  'SAMO': 'samoyedcoin',
  'NINJA': 'ninja-protocol',
  'STEP': 'step-finance',
  'PORT': 'port-finance',
  
  // Base ecosystem
  'AERODROME': 'aerodrome-finance',
  'WELL': 'moonwell',
  'PRIME': 'echelon-prime',
  'DEGEN': 'degen-base',
  'TOSHI': 'toshi',
  'KEYCAT': 'keyboard-cat',
  'HIGHER': 'higher',
  'MFER': 'mfercoin',
  
  // Arbitrum ecosystem
  'ARB': 'arbitrum',
  'GMX': 'gmx',
  'MAGIC': 'magic',
  'GRAIL': 'camelot-token',
  'RDNT': 'radiant-capital',
  'JONES': 'jones-dao',
  'UMAMI': 'umami-finance',
  'SPERAX': 'sperax',
  'DBL': 'doubloon',
  'SPARTA': 'spartan-protocol-token',
  
  // Problem tokens - manual mapping for known issues
  'REKT': 'rekt-2', // This was the issue mentioned
  'AI': 'sleepless-ai',
  'TURBO': 'turbo',
  'JESUS': 'jesus-coin',
  'ROCK': 'rocket-pool',
  'MOON': 'mooncoin',
  'SUN': 'sun-token',
  'SAFE': 'safe-token',
  'TIME': 'time',
  'SPACE': 'space-token',
  'LOVE': 'defi-love',
  'GOLD': 'gold-secured-currency',
  'DIAMOND': 'diamond',
  'FIRE': 'fire-protocol',
  'ICE': 'ice-token',
  'WATER': 'water',
  'EARTH': 'earth-token',
  'WIND': 'wind-token',
}

// Cache for search results to improve performance
const searchCache = new Map<string, string>()
const priceCache = new Map<string, { price: number; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute cache

interface CoinGeckoSearchResult {
  coins: Array<{
    id: string
    symbol: string
    name: string
  }>
}

interface CoinGeckoPriceResult {
  [key: string]: {
    usd: number
    usd_24h_change?: number
    usd_market_cap?: number
    usd_24h_vol?: number
  }
}

async function searchCoinGeckoId(ticker: string): Promise<string | null> {
  console.log(`🔍 Searching CoinGecko for ticker: ${ticker}`)
  
  // Check cache first
  if (searchCache.has(ticker)) {
    console.log(`📋 Cache hit for ticker: ${ticker}`)
    return searchCache.get(ticker)!
  }
  
  try {
    // Search by symbol first
    const searchResponse = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${ticker}`,
      {
        headers: {
          'accept': 'application/json',
        }
      }
    )
    
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`)
    }
    
    const searchData: CoinGeckoSearchResult = await searchResponse.json()
    
    // Look for exact symbol match first
    const exactMatch = searchData.coins.find(coin => 
      coin.symbol.toUpperCase() === ticker.toUpperCase()
    )
    
    if (exactMatch) {
      console.log(`✅ Found exact match: ${ticker} -> ${exactMatch.id}`)
      searchCache.set(ticker, exactMatch.id)
      return exactMatch.id
    }
    
    // If no exact match, try the first result with similar symbol
    const similarMatch = searchData.coins.find(coin => 
      coin.symbol.toUpperCase().includes(ticker.toUpperCase()) ||
      ticker.toUpperCase().includes(coin.symbol.toUpperCase())
    )
    
    if (similarMatch) {
      console.log(`⚠️ Found similar match: ${ticker} -> ${similarMatch.id}`)
      searchCache.set(ticker, similarMatch.id)
      return similarMatch.id
    }
    
    console.log(`❌ No match found for ticker: ${ticker}`)
    return null
    
  } catch (error) {
    console.error(`🚨 Error searching for ${ticker}:`, error)
    return null
  }
}

// Enhanced case-insensitive lookup function
function getCoinGeckoIdFromMapping(ticker: string): string | null {
  const cleanTicker = ticker.toUpperCase().trim();
  return TICKER_TO_COINGECKO_ID[cleanTicker] || null;
}

async function getCoinGeckoId(ticker: string): Promise<string | null> {
  console.log(`🎯 Getting CoinGecko ID for ticker: ${ticker}`)
  
  // First check our manual mapping with case-insensitive lookup
  const mappedId = getCoinGeckoIdFromMapping(ticker);
  if (mappedId) {
    console.log(`📍 Found manual mapping: ${ticker.toUpperCase()} -> ${mappedId}`)
    return mappedId
  }
  
  // Fallback to search API
  console.log(`🔍 No manual mapping found for ${ticker}, trying search API...`)
  return await searchCoinGeckoId(ticker)
}

async function getCurrentPrice(coinGeckoId: string): Promise<number | null> {
  console.log(`💰 Fetching price for: ${coinGeckoId}`)
  
  // Check cache first
  const cached = priceCache.get(coinGeckoId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Cache hit for price: ${coinGeckoId} = $${cached.price}`)
    return cached.price
  }
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      {
        headers: {
          'accept': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Price API error: ${response.status}`)
    }
    
    const data: CoinGeckoPriceResult = await response.json()
    
    if (data[coinGeckoId]) {
      const price = data[coinGeckoId].usd
      
      // Cache the result
      priceCache.set(coinGeckoId, {
        price,
        timestamp: Date.now()
      })
      
      console.log(`✅ Retrieved price: ${coinGeckoId} = $${price}`)
      return price
    }
    
    console.log(`❌ No price data found for: ${coinGeckoId}`)
    return null
    
  } catch (error) {
    console.error(`🚨 Error fetching price for ${coinGeckoId}:`, error)
    return null
  }
}

async function getDetailedPriceInfo(coinGeckoId: string): Promise<any> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      {
        headers: {
          'accept': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Detailed price API error: ${response.status}`)
    }
    
    const data: CoinGeckoPriceResult = await response.json()
    return data[coinGeckoId] || null
    
  } catch (error) {
    console.error(`🚨 Error fetching detailed price for ${coinGeckoId}:`, error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const url = new URL(req.url)
    const ticker = url.searchParams.get('ticker')
    const detailed = url.searchParams.get('detailed') === 'true'
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing ticker parameter',
          example: '/crypto-pricing?ticker=BTC'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log(`🚀 Processing price request for ticker: ${ticker}`)
    
    // Get CoinGecko ID
    const coinGeckoId = await getCoinGeckoId(ticker)
    
    if (!coinGeckoId) {
      return new Response(
        JSON.stringify({ 
          error: `Ticker "${ticker}" not found on CoinGecko`,
          ticker: ticker.toUpperCase(),
          suggestion: 'Please check the ticker symbol or add manual mapping'
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    if (detailed) {
      // Get detailed price information
      const priceInfo = await getDetailedPriceInfo(coinGeckoId)
      
      if (!priceInfo) {
        return new Response(
          JSON.stringify({ 
            error: `Could not fetch price data for ${ticker}`,
            coinGeckoId,
            ticker: ticker.toUpperCase()
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({
          ticker: ticker.toUpperCase(),
          coinGeckoId,
          price: priceInfo.usd,
          change24h: priceInfo.usd_24h_change || 0,
          marketCap: priceInfo.usd_market_cap || 0,
          volume24h: priceInfo.usd_24h_vol || 0,
          timestamp: new Date().toISOString(),
          source: 'coingecko'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Get simple price
      const price = await getCurrentPrice(coinGeckoId)
      
      if (price === null) {
        return new Response(
          JSON.stringify({ 
            error: `Could not fetch price for ${ticker}`,
            coinGeckoId,
            ticker: ticker.toUpperCase()
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({
          ticker: ticker.toUpperCase(),
          coinGeckoId,
          price,
          timestamp: new Date().toISOString(),
          source: 'coingecko'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
  } catch (error) {
    console.error('🚨 Crypto pricing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
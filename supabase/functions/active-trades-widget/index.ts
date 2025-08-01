
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'
import { generateDemoTradeAlerts } from './data-generator.ts'
import { generateStyledHTML } from './template.ts'
import type { TradeAlert } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Enhanced CSP headers for the iframe content
const cspHeaders = {
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.coingecko.com;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'ALLOWALL',
  'Referrer-Policy': 'same-origin'
}

// CoinGecko API for live prices (free tier, no API key needed)
const fetchLivePrices = async (symbols: string[]) => {
  try {
    const coinGeckoIds = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AVAX': 'avalanche-2',
      'ATOM': 'cosmos',
      'XRP': 'ripple',
      'MKR': 'maker',
      'HYPE': 'hyperliquid',
      'TRX': 'tron'
    };

    const validSymbols = symbols.filter(symbol => coinGeckoIds[symbol]);
    if (validSymbols.length === 0) return {};

    const ids = validSymbols.map(symbol => coinGeckoIds[symbol]).join(',');
    console.log('🔄 Fetching live prices for symbols:', validSymbols);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );

    if (!response.ok) {
      console.warn('⚠️ CoinGecko API error:', response.status);
      return {};
    }

    const data = await response.json();
    const priceMap = {};
    
    validSymbols.forEach(symbol => {
      const coinId = coinGeckoIds[symbol];
      if (data[coinId]) {
        priceMap[symbol] = {
          price: data[coinId].usd,
          change_24h: data[coinId].usd_24h_change || 0
        };
        console.log(`💰 ${symbol}: $${data[coinId].usd}`);
      }
    });

    return priceMap;
  } catch (error) {
    console.error('❌ Error fetching live prices:', error);
    return {};
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📊 Starting active trades widget request - v2.2.0-CSP-FIXED...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing required environment variables');
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Fetching active crypto alerts from database...');

    // Fetch both active positions and awaiting entry alerts with simpler filters
    const { data: activeAlerts, error: activeError } = await supabase
      .from('crypto_alerts')
      .select('*')
      .eq('is_active', true)
      .eq('entry_activated', true)
      .eq('stopped_out', false)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: awaitingAlerts, error: awaitingError } = await supabase
      .from('crypto_alerts')
      .select('*')
      .eq('is_active', true)
      .eq('entry_activated', false)
      .eq('stopped_out', false)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🔍 Database query results:', { 
      activeCount: activeAlerts?.length || 0, 
      awaitingCount: awaitingAlerts?.length || 0,
      activeError, 
      awaitingError,
      activeData: activeAlerts?.slice(0, 2),
      awaitingData: awaitingAlerts?.slice(0, 2)
    });

    if (activeError || awaitingError) {
      console.error('❌ Database error:', activeError || awaitingError);
      throw activeError || awaitingError;
    }

    const totalAlerts = (activeAlerts?.length || 0) + (awaitingAlerts?.length || 0);
    
    if (totalAlerts === 0) {
      console.log('⚠️ No active crypto alerts found in database');
      // Return empty widget instead of demo data
      const alerts = [];
      return new Response(
        generateStyledHTML(alerts),
        { 
          headers: { 
            ...corsHeaders, 
            ...cspHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          } 
        }
      );
    }

    console.log('✅ Found total alerts:', totalAlerts, '(Active:', activeAlerts?.length || 0, 'Awaiting:', awaitingAlerts?.length || 0, ')');
    
    // Combine both arrays for symbol extraction
    const allAlerts = [...(activeAlerts || []), ...(awaitingAlerts || [])];
    
    // Get unique symbols for price fetching using CORRECT symbol column
    const symbols = [...new Set(allAlerts.map(alert => alert.symbol))];
    console.log('🎯 Symbols to fetch prices for:', symbols);
    
    // Fetch live prices with error handling and timeout
    let livePrices = {};
    try {
      livePrices = await fetchLivePrices(symbols);
      console.log('📈 Live prices fetched successfully for', Object.keys(livePrices).length, 'symbols');
    } catch (priceError) {
      console.warn('⚠️ Failed to fetch live prices, using database prices:', priceError);
    }

    // Transform database data to widget format - separate active and awaiting
    const transformAlert = (alert: any, isAwaiting = false) => {
      const livePrice = livePrices[alert.symbol];
      const currentPrice = livePrice ? livePrice.price : (alert.current_price || alert.entry_price);
      const entryPrice = parseFloat(alert.entry_price || 0);
      const stopLossPrice = parseFloat(alert.stop_loss_price || 0);
      const takeProfitPrice = parseFloat(alert.take_profit_price || alert.target_price || 0);
      const quantity = parseFloat(alert.quantity || 1);
      
      // Calculate P&L with current price (only for active positions)
      const profitLoss = isAwaiting ? 0 : (currentPrice - entryPrice) * quantity;
      const profitPercentage = isAwaiting ? 0 : (entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0);
      
      console.log(`📊 Processing ${alert.symbol} (${isAwaiting ? 'AWAITING' : 'ACTIVE'}):`, {
        trader: alert.trader_name,
        entry: entryPrice,
        current: currentPrice,
        profitPercentage: profitPercentage.toFixed(2) + '%'
      });
      
      return {
        id: alert.id,
        symbol: alert.symbol,
        trader: alert.trader_name,
        entry_price: entryPrice,
        current_price: currentPrice,
        profit_loss: profitLoss,
        profit_percentage: profitPercentage,
        stop_loss_price: stopLossPrice || undefined,
        take_profit_price: takeProfitPrice || undefined,
        entry_activated: !isAwaiting,
      };
    };

    // Process both types of alerts
    const activeTradeAlerts = (activeAlerts || []).map(alert => transformAlert(alert, false));
    const awaitingTradeAlerts = (awaitingAlerts || []).map(alert => transformAlert(alert, true));
    
    // Combine for template (template will handle the separation)
    const alerts = [...activeTradeAlerts, ...awaitingTradeAlerts];

    console.log('📤 Returning CSP-compliant styled HTML with', activeTradeAlerts.length, 'active and', awaitingTradeAlerts.length, 'awaiting alerts');

    return new Response(
      generateStyledHTML(alerts),
      { 
        headers: { 
          ...corsHeaders, 
          ...cspHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in active-trades-widget function:', error);
    
    // Return a simple error page instead of empty response
    const errorHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Weekly Wiz Alerts</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: white;
            padding: 40px;
            text-align: center;
            margin: 0;
        }
        .error {
            color: #ef4444;
            font-size: 18px;
            margin-bottom: 16px;
        }
        .message {
            color: #94a3b8;
            margin-bottom: 20px;
        }
        .version {
            color: #64748b;
            font-size: 12px;
            margin-top: 20px;
        }
        .reload-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="error">⚠️ Error Loading Trades</div>
    <div class="message">Unable to fetch trading data. This might be a temporary issue.</div>
    <button class="reload-btn" onclick="window.location.reload()">Retry</button>
    <div class="version">Widget v2.2.0-CSP-FIXED</div>
    <script>
        console.error('Widget error:', ${JSON.stringify(error.message)});
        // Auto-retry after 10 seconds
        setTimeout(function() {
            window.location.reload();
        }, 10000);
    </script>
</body>
</html>`;

    return new Response(
      errorHTML,
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          ...cspHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );
  }
});

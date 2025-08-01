import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface AlertRequest {
  coin: string;
  entry_price: number;
  target_price?: number;
  stop_loss_price?: number;
  position_type?: 'long' | 'short';
  caller?: string;
  note?: string;
  time_conditions?: Array<{
    type: 'candlestick_close';
    enabled: boolean;
    config: {
      timeframe: string;
      waitForClose?: boolean;
    };
  }>;
}

// CoinGecko ID mapping (simplified for demo)
const coinGeckoIdMap: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'NEAR': 'near',
  'FTM': 'fantom',
  'ALGO': 'algorand',
  'XTZ': 'tezos',
  'ICP': 'internet-computer',
  'FLOW': 'flow',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity',
  'ENJ': 'enjincoin',
  'GALA': 'gala'
};

function autoDetectPositionType(entryPrice: number, targetPrice?: number, stopLossPrice?: number): 'long' | 'short' {
  if (targetPrice && targetPrice > entryPrice) return 'long';
  if (targetPrice && targetPrice < entryPrice) return 'short';
  if (stopLossPrice && stopLossPrice < entryPrice) return 'long';
  if (stopLossPrice && stopLossPrice > entryPrice) return 'short';
  return 'long'; // Default to long
}

function validatePositionLogic(entryPrice: number, targetPrice?: number, stopLossPrice?: number, positionType?: string): string[] {
  const errors: string[] = [];
  
  if (entryPrice <= 0) {
    errors.push('Entry price must be positive');
  }
  
  if (positionType === 'long') {
    if (targetPrice && targetPrice <= entryPrice) {
      errors.push('Target price must be above entry price for long positions');
    }
    if (stopLossPrice && stopLossPrice >= entryPrice) {
      errors.push('Stop loss must be below entry price for long positions');
    }
  } else if (positionType === 'short') {
    if (targetPrice && targetPrice >= entryPrice) {
      errors.push('Target price must be below entry price for short positions');
    }
    if (stopLossPrice && stopLossPrice <= entryPrice) {
      errors.push('Stop loss must be above entry price for short positions');
    }
  }
  
  return errors;
}

function calculateRiskRewardRatio(entryPrice: number, targetPrice?: number, stopLossPrice?: number, positionType?: string): number | null {
  if (!targetPrice || !stopLossPrice) return null;
  
  const risk = Math.abs(entryPrice - stopLossPrice);
  const reward = Math.abs(targetPrice - entryPrice);
  
  return risk > 0 ? reward / risk : null;
}

function getWarnings(riskRewardRatio: number | null, autoResolvedCoinGecko: boolean): string[] {
  const warnings: string[] = [];
  
  if (autoResolvedCoinGecko) {
    warnings.push('Auto-resolved CoinGecko ID');
  }
  
  if (riskRewardRatio !== null) {
    if (riskRewardRatio < 1.0) {
      warnings.push(`Low risk/reward ratio: ${riskRewardRatio.toFixed(2)} (consider improving targets)`);
    } else if (riskRewardRatio > 5.0) {
      warnings.push(`Very high risk/reward ratio: ${riskRewardRatio.toFixed(2)} (verify stop loss placement)`);
    }
  }
  
  return warnings;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const alertData: AlertRequest = await req.json();

    // Validate required fields
    if (!alertData.coin || !alertData.entry_price) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          errors: ['Coin symbol and entry price are required'],
          warnings: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-detect position type if not provided
    const positionType = alertData.position_type || autoDetectPositionType(
      alertData.entry_price, 
      alertData.target_price, 
      alertData.stop_loss_price
    );

    // Validate position logic
    const validationErrors = validatePositionLogic(
      alertData.entry_price,
      alertData.target_price,
      alertData.stop_loss_price,
      positionType
    );

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          errors: validationErrors,
          warnings: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-resolve CoinGecko ID
    const coinSymbol = alertData.coin.toUpperCase();
    const coinGeckoId = coinGeckoIdMap[coinSymbol] || coinSymbol.toLowerCase();
    const autoResolvedCoinGecko = !!coinGeckoIdMap[coinSymbol];

    // Calculate risk/reward ratio
    const riskRewardRatio = calculateRiskRewardRatio(
      alertData.entry_price,
      alertData.target_price,
      alertData.stop_loss_price,
      positionType
    );

    // Generate warnings
    const warnings = getWarnings(riskRewardRatio, autoResolvedCoinGecko);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert alert into crypto_alerts table
    const { data, error } = await supabase
      .from('crypto_alerts')
      .insert({
        symbol: coinSymbol,
        entry_price: alertData.entry_price,
        target_price: alertData.target_price,
        stop_loss_price: alertData.stop_loss_price,
        position_type: positionType,
        trader_name: alertData.caller || 'External API',
        trading_type: 'spot', // Default to spot
        metadata: {
          note: alertData.note,
          time_conditions: alertData.time_conditions,
          api_source: true,
          created_via: 'external-api',
          coingecko_id: coinGeckoId,
          risk_reward_ratio: riskRewardRatio,
          auto_resolved_coingecko_id: autoResolvedCoinGecko
        },
        status: 'active',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          errors: ['Failed to create alert: ' + error.message],
          warnings: []
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced success response matching the new specification
    return new Response(
      JSON.stringify({
        success: true,
        alert_id: data.id,
        message: 'Alert created successfully',
        alert_data: {
          coin: coinSymbol,
          entry_price: alertData.entry_price,
          target_price: alertData.target_price,
          stop_loss_price: alertData.stop_loss_price,
          position_type: positionType,
          coingecko_id: coinGeckoId,
          has_time_conditions: !!(alertData.time_conditions && alertData.time_conditions.length > 0)
        },
        validation: {
          warnings: warnings,
          auto_resolved_coingecko_id: autoResolvedCoinGecko
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        errors: ['Internal server error: ' + (error as Error).message] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
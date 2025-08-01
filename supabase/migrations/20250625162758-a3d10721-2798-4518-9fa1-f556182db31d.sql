
-- Update crypto_alerts table to add missing fields and improve the data structure
ALTER TABLE public.crypto_alerts 
ADD COLUMN IF NOT EXISTS take_profit_price numeric,
ADD COLUMN IF NOT EXISTS trade_status text DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS trading_type text DEFAULT 'Spot',
ADD COLUMN IF NOT EXISTS progress_percentage numeric DEFAULT 0;

-- Rename target_price to take_profit_price if it exists (we'll keep both for compatibility)
UPDATE public.crypto_alerts 
SET take_profit_price = target_price 
WHERE take_profit_price IS NULL AND target_price IS NOT NULL;

-- Update existing alerts with proper stop loss values and realistic trader names
UPDATE public.crypto_alerts SET
  stop_loss_price = CASE 
    WHEN symbol = 'BTC' THEN 44000.00
    WHEN symbol = 'ETH' THEN 2750.00
    WHEN symbol = 'ADA' THEN 0.42
    WHEN symbol = 'DOT' THEN 8.80
    WHEN symbol = 'SOL' THEN 92.00
    WHEN symbol = 'MATIC' THEN 0.80
    WHEN symbol = 'LINK' THEN 11.50
    WHEN symbol = 'UNI' THEN 7.50
    WHEN symbol = 'AVAX' THEN 17.00
    WHEN symbol = 'ATOM' THEN 9.20
    WHEN symbol = 'XRP' THEN 0.48
    ELSE entry_price * 0.95
  END,
  trader_name = CASE 
    WHEN symbol = 'BTC' THEN 'Foxy'
    WHEN symbol = 'ETH' THEN 'Daniel'
    WHEN symbol = 'ADA' THEN 'Sarah_Crypto'
    WHEN symbol = 'DOT' THEN 'Mike_Trader'
    WHEN symbol = 'SOL' THEN 'Alex_Sol'
    WHEN symbol = 'MATIC' THEN 'Jenny_DeFi'
    WHEN symbol = 'LINK' THEN 'Chris_Chain'
    WHEN symbol = 'UNI' THEN 'Sam_Dex'
    WHEN symbol = 'AVAX' THEN 'Lisa_Snow'
    WHEN symbol = 'ATOM' THEN 'Tom_Cosmos'
    WHEN symbol = 'XRP' THEN 'Kate_XRP'
    ELSE trader_name
  END,
  trade_status = 'Active',
  trading_type = 'Spot',
  take_profit_price = CASE 
    WHEN take_profit_price IS NULL THEN target_price
    ELSE take_profit_price
  END
WHERE stop_loss_price IS NULL OR trader_name IN ('CryptoMaster', 'EthTrader', 'CardanoFan', 'PolkadotPro', 'SolanaKing', 'PolygonPower', 'ChainlinkChamp', 'UniswapUser', 'AvalanchePro', 'CosmosTrader', 'RippleRider');

-- Calculate progress percentage based on current price position between SL and TP
UPDATE public.crypto_alerts SET
  progress_percentage = CASE 
    WHEN take_profit_price > entry_price THEN -- Long position
      CASE 
        WHEN current_price <= stop_loss_price THEN 0
        WHEN current_price >= take_profit_price THEN 100
        ELSE ((current_price - stop_loss_price) / (take_profit_price - stop_loss_price)) * 100
      END
    ELSE -- Short position
      CASE 
        WHEN current_price >= stop_loss_price THEN 0
        WHEN current_price <= take_profit_price THEN 100
        ELSE ((stop_loss_price - current_price) / (stop_loss_price - take_profit_price)) * 100
      END
  END
WHERE stop_loss_price IS NOT NULL AND take_profit_price IS NOT NULL AND current_price IS NOT NULL;

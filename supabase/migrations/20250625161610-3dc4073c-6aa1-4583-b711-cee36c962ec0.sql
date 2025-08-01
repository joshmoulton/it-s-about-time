
-- Create the crypto_alerts table for cryptocurrency trading alerts
CREATE TABLE public.crypto_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol text NOT NULL, -- e.g., "BTC", "ETH", "ADA"
  trader_name text NOT NULL DEFAULT 'Unknown',
  position_type text NOT NULL DEFAULT 'Long', -- Long, Short
  entry_price numeric NOT NULL,
  target_price numeric NOT NULL,
  current_price numeric DEFAULT NULL, -- Will be fetched live
  stop_loss_price numeric DEFAULT NULL,
  quantity numeric DEFAULT 1,
  entry_activated boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  invalidated boolean NOT NULL DEFAULT false,
  triggered_at timestamp with time zone DEFAULT NULL,
  stopped_out boolean NOT NULL DEFAULT false,
  profit_loss numeric DEFAULT 0,
  profit_percentage numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add Row Level Security (RLS)
ALTER TABLE public.crypto_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading all active alerts (for the widget)
CREATE POLICY "Allow reading active crypto alerts" 
  ON public.crypto_alerts 
  FOR SELECT 
  USING (is_active = true AND invalidated = false);

-- Create policy for authenticated users to manage their own alerts
CREATE POLICY "Users can manage their own crypto alerts" 
  ON public.crypto_alerts 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Insert sample active crypto alerts (11 alerts as mentioned)
INSERT INTO public.crypto_alerts (
  symbol, trader_name, position_type, entry_price, target_price, current_price,
  entry_activated, is_active, invalidated, triggered_at, stopped_out,
  profit_loss, profit_percentage, metadata
) VALUES 
  ('BTC', 'CryptoMaster', 'Long', 45000.00, 48000.00, 46200.00, true, true, false, NULL, false, 1200.00, 2.67, '{"exchange": "Binance"}'),
  ('ETH', 'EthTrader', 'Long', 2800.00, 3200.00, 2950.00, true, true, false, NULL, false, 150.00, 5.36, '{"exchange": "Coinbase"}'),
  ('ADA', 'CardanoFan', 'Long', 0.45, 0.55, 0.48, true, true, false, NULL, false, 0.03, 6.67, '{"exchange": "Kraken"}'),
  ('DOT', 'PolkadotPro', 'Short', 8.50, 7.20, 8.10, true, true, false, NULL, false, 0.40, 4.71, '{"exchange": "Binance"}'),
  ('SOL', 'SolanaKing', 'Long', 95.00, 110.00, 102.00, true, true, false, NULL, false, 7.00, 7.37, '{"exchange": "FTX"}'),
  ('MATIC', 'PolygonPower', 'Long', 0.85, 1.10, 0.92, true, true, false, NULL, false, 0.07, 8.24, '{"exchange": "Binance"}'),
  ('LINK', 'ChainlinkChamp', 'Long', 12.50, 16.00, 13.80, true, true, false, NULL, false, 1.30, 10.40, '{"exchange": "Coinbase"}'),
  ('UNI', 'UniswapUser', 'Short', 7.20, 6.00, 6.80, true, true, false, NULL, false, 0.40, 5.56, '{"exchange": "Uniswap"}'),
  ('AVAX', 'AvalanchePro', 'Long', 18.00, 22.00, 19.50, true, true, false, NULL, false, 1.50, 8.33, '{"exchange": "Binance"}'),
  ('ATOM', 'CosmosTrader', 'Long', 9.80, 12.50, 10.60, true, true, false, NULL, false, 0.80, 8.16, '{"exchange": "Kraken"}'),
  ('XRP', 'RippleRider', 'Long', 0.52, 0.65, 0.56, true, true, false, NULL, false, 0.04, 7.69, '{"exchange": "Binance"}');

-- Create index for better performance
CREATE INDEX idx_crypto_alerts_active ON public.crypto_alerts(is_active, invalidated, entry_activated);
CREATE INDEX idx_crypto_alerts_symbol ON public.crypto_alerts(symbol);

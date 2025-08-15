-- Create enhanced live trading framework tables (fixed structure)

-- Drop existing objects if they exist
DROP VIEW IF EXISTS public.signals_overview;

-- Create ticker_mappings table for cross-API ticker mapping
CREATE TABLE IF NOT EXISTS public.ticker_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL UNIQUE,
  coingecko_id TEXT,
  cmc_id INTEGER,
  binance_symbol TEXT,
  coin_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price_ticks table for real-time price data
CREATE TABLE IF NOT EXISTS public.price_ticks (
  id BIGSERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  symbol TEXT,
  source TEXT NOT NULL,
  price NUMERIC NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create live_trading_signals table for signal management
CREATE TABLE IF NOT EXISTS public.live_trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('market', 'limit', 'conditional', 'trigger')),
  entry_price NUMERIC,
  current_price NUMERIC,
  stop_loss_price NUMERIC,
  targets JSONB DEFAULT '[]'::jsonb,
  size_level TEXT CHECK (size_level IN ('small', 'medium', 'large')),
  risk_score INTEGER DEFAULT 5,
  confidence_score NUMERIC DEFAULT 0.5,
  reasoning TEXT,
  analyst_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'completed', 'invalidated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  hit_targets JSONB DEFAULT '[]'::jsonb,
  max_profit_pct NUMERIC DEFAULT 0,
  current_profit_pct NUMERIC DEFAULT 0,
  stopped_out BOOLEAN DEFAULT false,
  invalidation_type TEXT,
  invalidation_price NUMERIC,
  invalidation_tf TEXT,
  last_price NUMERIC
);

-- Create signal_events table for event tracking
CREATE TABLE IF NOT EXISTS public.signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES public.live_trading_signals(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('target_hit', 'stop_hit', 'invalidation', 'entry_filled')),
  level INTEGER,
  detail JSONB DEFAULT '{}'::jsonb,
  happened_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Now create the view after all tables exist
CREATE VIEW public.signals_overview AS
SELECT * FROM public.live_trading_signals WHERE status = 'active';

-- Enable RLS on all tables
ALTER TABLE public.ticker_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "ticker_mappings_public_read" ON public.ticker_mappings FOR SELECT USING (true);
CREATE POLICY "ticker_mappings_admin_manage" ON public.ticker_mappings FOR ALL USING (is_current_user_admin_fast()) WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "price_ticks_public_read" ON public.price_ticks FOR SELECT USING (true);
CREATE POLICY "price_ticks_system_write" ON public.price_ticks FOR INSERT WITH CHECK (true);

CREATE POLICY "live_trading_signals_admin_manage" ON public.live_trading_signals FOR ALL USING (is_current_user_admin_fast()) WITH CHECK (is_current_user_admin_fast());
CREATE POLICY "live_trading_signals_authenticated_read" ON public.live_trading_signals FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "signal_events_admin_manage" ON public.signal_events FOR ALL USING (is_current_user_admin_fast()) WITH CHECK (is_current_user_admin_fast());
CREATE POLICY "signal_events_authenticated_read" ON public.signal_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "signal_events_system_write" ON public.signal_events FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_ticks_ticker_time ON public.price_ticks(ticker, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_trading_signals_status ON public.live_trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_live_trading_signals_ticker ON public.live_trading_signals(ticker);
CREATE INDEX IF NOT EXISTS idx_signal_events_signal_id ON public.signal_events(signal_id);

-- Create triggers for updated_at
CREATE TRIGGER update_ticker_mappings_updated_at BEFORE UPDATE ON public.ticker_mappings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_live_trading_signals_updated_at BEFORE UPDATE ON public.live_trading_signals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add initial data
INSERT INTO public.ticker_mappings (ticker, coingecko_id, binance_symbol, coin_name) VALUES
  ('BTC', 'bitcoin', 'BTCUSDT', 'Bitcoin'),
  ('ETH', 'ethereum', 'ETHUSDT', 'Ethereum'),
  ('SOL', 'solana', 'SOLUSDT', 'Solana'),
  ('DOGE', 'dogecoin', 'DOGEUSDT', 'Dogecoin')
ON CONFLICT (ticker) DO NOTHING;
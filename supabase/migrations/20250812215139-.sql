-- Create crypto pricing tables
CREATE TABLE IF NOT EXISTS public.crypto_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL UNIQUE,
    price_usd DECIMAL(20, 8) NOT NULL,
    price_change_24h DECIMAL(10, 4),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crypto_coin_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL UNIQUE,
    coingecko_id TEXT NOT NULL,
    coin_name TEXT,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_crypto_prices_ticker ON public.crypto_prices(ticker);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_last_updated ON public.crypto_prices(last_updated);
CREATE INDEX IF NOT EXISTS idx_crypto_coin_mappings_ticker ON public.crypto_coin_mappings(ticker);
CREATE INDEX IF NOT EXISTS idx_crypto_coin_mappings_coingecko_id ON public.crypto_coin_mappings(coingecko_id);

-- Enable RLS
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_coin_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "crypto_prices_public_read" ON public.crypto_prices
    FOR SELECT USING (true);

CREATE POLICY "crypto_coin_mappings_public_read" ON public.crypto_coin_mappings
    FOR SELECT USING (true);

-- Admin policies for write access
CREATE POLICY "crypto_prices_admin_write" ON public.crypto_prices
    FOR ALL USING (is_current_user_admin_fast())
    WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "crypto_coin_mappings_admin_write" ON public.crypto_coin_mappings
    FOR ALL USING (is_current_user_admin_fast())
    WITH CHECK (is_current_user_admin_fast());

-- Insert some initial coin mappings for popular tokens
INSERT INTO public.crypto_coin_mappings (ticker, coingecko_id, coin_name) VALUES
    ('BTC', 'bitcoin', 'Bitcoin'),
    ('ETH', 'ethereum', 'Ethereum'),
    ('SOL', 'solana', 'Solana'),
    ('LINK', 'chainlink', 'Chainlink'),
    ('PENGU', 'pudgy-penguins', 'Pudgy Penguins'),
    ('FART', 'fartcoin', 'Fartcoin'),
    ('BONK', 'bonk', 'Bonk'),
    ('WIF', 'dogwifcoin', 'dogwifhat'),
    ('PEPE', 'pepe', 'Pepe'),
    ('SHIB', 'shiba-inu', 'Shiba Inu'),
    ('DOGE', 'dogecoin', 'Dogecoin')
ON CONFLICT (ticker) DO NOTHING;
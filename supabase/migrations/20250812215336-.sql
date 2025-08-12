-- Trigger initial price fetch for PENGU to test the system
-- This would normally be done by the edge function, but let's bootstrap it
INSERT INTO public.crypto_prices (ticker, price_usd, price_change_24h, last_updated) 
VALUES ('PENGU', 0.035, -2.5, NOW())
ON CONFLICT (ticker) DO UPDATE SET
    price_usd = EXCLUDED.price_usd,
    price_change_24h = EXCLUDED.price_change_24h,
    last_updated = EXCLUDED.last_updated,
    updated_at = NOW();
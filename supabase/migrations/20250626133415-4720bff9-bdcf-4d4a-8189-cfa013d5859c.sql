
-- Remove all the demo/test alerts from the crypto_alerts table
DELETE FROM public.crypto_alerts 
WHERE trader_name IN ('CryptoMaster', 'EthTrader', 'CardanoFan', 'PolkadotPro', 'SolanaKing', 'PolygonPower', 'ChainlinkChamp', 'UniswapUser', 'AvalanchePro', 'CosmosTrader', 'RippleRider')
OR symbol IN ('BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'LINK', 'UNI', 'AVAX', 'ATOM', 'XRP');

-- This will remove the sample data that was inserted during setup
-- The widget will now only show actual trading alerts that are added through your real trading system

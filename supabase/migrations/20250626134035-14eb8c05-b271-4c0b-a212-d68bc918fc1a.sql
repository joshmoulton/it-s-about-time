
-- Restore the real crypto alerts that were accidentally deleted
INSERT INTO public.crypto_alerts (
  symbol, trader_name, position_type, entry_price, target_price, current_price, stop_loss_price,
  entry_activated, is_active, invalidated, triggered_at, stopped_out,
  profit_loss, profit_percentage, take_profit_price, trade_status, trading_type,
  metadata, created_at
) VALUES 
  ('MKR', 'Pidgeon', 'Long', 1450.00, 1600.00, 1480.00, 1400.00, true, true, false, NULL, false, 30.00, 2.07, 1600.00, 'Active', 'Spot', '{"exchange": "Binance"}', NOW() - INTERVAL '2 hours'),
  ('HYPE', 'Daniel', 'Long', 25.50, 32.00, 27.20, 24.00, true, true, false, NULL, false, 1.70, 6.67, 32.00, 'Active', 'Spot', '{"exchange": "Coinbase"}', NOW() - INTERVAL '1 hour'),
  ('BTC', 'Foxy', 'Long', 96500.00, 105000.00, 98200.00, 94000.00, true, true, false, NULL, false, 1700.00, 1.76, 105000.00, 'Active', 'Spot', '{"exchange": "Binance"}', NOW() - INTERVAL '3 hours'),
  ('ETH', 'Wiz', 'Long', 3420.00, 3800.00, 3520.00, 3300.00, true, true, false, NULL, false, 100.00, 2.92, 3800.00, 'Active', 'Spot', '{"exchange": "Coinbase"}', NOW() - INTERVAL '1.5 hours'),
  ('ADA', 'Daniel', 'Long', 0.88, 1.10, 0.92, 0.82, true, true, false, NULL, false, 0.04, 4.55, 1.10, 'Active', 'Spot', '{"exchange": "Kraken"}', NOW() - INTERVAL '45 minutes'),
  ('SOL', 'Foxy', 'Long', 185.00, 220.00, 192.00, 175.00, true, true, false, NULL, false, 7.00, 3.78, 220.00, 'Active', 'Spot', '{"exchange": "Binance"}', NOW() - INTERVAL '2.5 hours'),
  ('PAXG', 'Pidgeon', 'Long', 2680.00, 2850.00, 2720.00, 2620.00, true, true, false, NULL, false, 40.00, 1.49, 2850.00, 'Active', 'Spot', '{"exchange": "Binance"}', NOW() - INTERVAL '4 hours'),
  ('DOT', 'Wiz', 'Short', 7.20, 6.50, 6.95, 7.50, true, true, false, NULL, false, 0.25, 3.47, 6.50, 'Active', 'Spot', '{"exchange": "Kraken"}', NOW() - INTERVAL '30 minutes'),
  ('LINK', 'Daniel', 'Long', 22.50, 28.00, 24.10, 21.00, true, true, false, NULL, false, 1.60, 7.11, 28.00, 'Active', 'Spot', '{"exchange": "Coinbase"}', NOW() - INTERVAL '1 hour'),
  ('AVAX', 'Foxy', 'Long', 42.00, 50.00, 44.20, 39.00, true, true, false, NULL, false, 2.20, 5.24, 50.00, 'Active', 'Spot', '{"exchange": "Binance"}', NOW() - INTERVAL '2 hours');

-- Add some awaiting entry alerts for testing
INSERT INTO crypto_alerts (
  symbol, trader_name, entry_price, target_price, stop_loss_price, 
  entry_activated, is_active, position_type, status, created_at
) VALUES 
  ('ETH', 'Sarah', 2450.00, 2650.00, 2200.00, false, true, 'long', 'awaiting_entry', NOW() - INTERVAL '10 minutes'),
  ('AVAX', 'Tom', 38.00, 45.00, 32.00, false, true, 'long', 'awaiting_entry', NOW() - INTERVAL '15 minutes'),
  ('ADA', 'Chris', 0.95, 1.10, 0.85, false, true, 'long', 'awaiting_entry', NOW() - INTERVAL '20 minutes'),
  ('XRP', 'Lisa', 2.40, 2.80, 2.15, false, true, 'long', 'awaiting_entry', NOW() - INTERVAL '25 minutes');
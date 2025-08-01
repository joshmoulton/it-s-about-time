-- Enable realtime for crypto_alerts table
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE crypto_alerts;
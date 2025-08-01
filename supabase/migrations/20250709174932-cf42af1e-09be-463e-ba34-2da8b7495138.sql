-- Reset X account sync timestamps to trigger fresh collection with new X API
UPDATE x_account_monitoring SET last_sync_at = NULL WHERE is_active = true;
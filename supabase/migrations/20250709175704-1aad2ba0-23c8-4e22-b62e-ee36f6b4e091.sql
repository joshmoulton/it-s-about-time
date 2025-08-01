-- Increase polling intervals to be more rate-limit friendly
UPDATE x_account_monitoring 
SET monitor_frequency_minutes = 20 
WHERE is_active = true;
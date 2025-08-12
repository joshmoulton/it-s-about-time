-- Insert channel configuration for the telegram chat to enable analyst call detection
INSERT INTO analyst_channel_config (
  chat_id,
  channel_name,
  analyst_id,
  is_monitoring_enabled,
  auto_process_calls,
  min_confidence_threshold
) 
SELECT 
  -1002083186778,
  'Weekly Wizdom Chat',
  NULL, -- No specific analyst, allow all patterns
  true,
  true,
  0.8
WHERE NOT EXISTS (
  SELECT 1 FROM analyst_channel_config WHERE chat_id = -1002083186778
);
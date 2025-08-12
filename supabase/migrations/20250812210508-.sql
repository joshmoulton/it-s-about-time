-- Insert channel configuration for the telegram chat to enable analyst call detection
INSERT INTO analyst_channel_config (
  chat_id,
  channel_name,
  analyst_id,
  is_monitoring_enabled,
  auto_process_calls,
  min_confidence_threshold
) VALUES (
  -1002083186778,
  'Weekly Wizdom Chat',
  NULL, -- No specific analyst, allow all patterns
  true,
  true,
  0.8
) ON CONFLICT (chat_id) DO UPDATE SET
  is_monitoring_enabled = true,
  auto_process_calls = true,
  min_confidence_threshold = 0.8,
  updated_at = now();
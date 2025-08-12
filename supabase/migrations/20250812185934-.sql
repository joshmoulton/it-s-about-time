-- Add fields to analyst_signals table for closure tracking
ALTER TABLE public.analyst_signals 
ADD COLUMN closed_at timestamp with time zone,
ADD COLUMN closed_by text,
ADD COLUMN close_reason text;

-- Insert analyst call pattern for close commands
INSERT INTO public.analyst_call_patterns (
  pattern_name,
  pattern_regex,
  extraction_config,
  is_active,
  priority
) VALUES (
  'Close Command Pattern',
  '!close\\s+([A-Z]+)',
  '{
    "command_type": "close",
    "ticker_group": 1,
    "fields": {
      "ticker": {"group": 1, "transform": "uppercase"},
      "command": {"value": "close"}
    }
  }'::jsonb,
  true,
  1
);

-- Insert channel config for monitoring (chat ID from logs: -1002083186778)
INSERT INTO public.analyst_channel_config (
  chat_id,
  channel_name,
  analyst_id,
  is_monitoring_enabled,
  auto_process_calls,
  min_confidence_threshold
) VALUES (
  -1002083186778,
  'Weekly Wizdom Telegram',
  (SELECT id FROM public.analysts LIMIT 1), -- Use first analyst or create one
  true,
  true,
  0.8
) ON CONFLICT (chat_id) DO UPDATE SET
  is_monitoring_enabled = true,
  auto_process_calls = true,
  updated_at = now();
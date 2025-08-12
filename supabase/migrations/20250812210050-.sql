-- Create analyst call pattern for close commands
INSERT INTO analyst_call_patterns (
  pattern_name,
  pattern_regex,
  extraction_config,
  is_active,
  priority
) VALUES (
  'Close Command Pattern',
  '!close\s+([A-Z]+)',
  '{
    "type": "close_command",
    "ticker_group": 1,
    "requires_original_caller": true,
    "description": "Detects !close TICKER commands to close existing degen calls"
  }',
  true,
  10
);
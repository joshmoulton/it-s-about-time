-- Fix the format_degen_call_message function to properly handle string parsing
CREATE OR REPLACE FUNCTION public.format_degen_call_message(signal_row analyst_signals)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  formatted_text TEXT;
  entry_display TEXT;
  invalidation_display TEXT;
  targets_display TEXT;
  targets_json JSONB;
  targets_string TEXT;
BEGIN
  -- Format entry
  IF signal_row.entry_type IN ('conditional', 'trigger') THEN
    entry_display := 'Read Further.';
  ELSE
    entry_display := COALESCE(signal_row.entry_price::TEXT, 'Market');
  END IF;
  
  -- Format invalidation/stop loss
  IF signal_row.risk_management = 'conditional' THEN
    invalidation_display := 'Read Further.';
  ELSE
    invalidation_display := COALESCE(signal_row.stop_loss_price::TEXT, 'See Description');
  END IF;
  
  -- Format targets - handle both string and JSONB formats
  BEGIN
    -- Try to parse as JSONB first
    IF jsonb_typeof(signal_row.targets) = 'array' THEN
      targets_json := signal_row.targets;
    ELSE
      -- Try to convert string to JSONB
      targets_json := signal_row.targets::text::jsonb;
    END IF;
    
    -- Check if we have valid targets
    IF targets_json IS NOT NULL AND jsonb_array_length(targets_json) > 0 THEN
      SELECT string_agg(value::TEXT, ', ') INTO targets_display
      FROM jsonb_array_elements_text(targets_json);
    ELSE
      targets_display := 'See Description';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If JSON parsing fails, try to extract from string format manually
    IF signal_row.targets IS NOT NULL THEN
      targets_string := signal_row.targets::TEXT;
      -- Remove brackets and quotes, then split by comma
      targets_string := regexp_replace(targets_string, '[\[\]"]', '', 'g');
      targets_string := regexp_replace(targets_string, '\s*,\s*', ', ', 'g');
      
      IF targets_string IS NOT NULL AND trim(targets_string) != '' THEN
        targets_display := targets_string;
      ELSE
        targets_display := 'See Description';
      END IF;
    ELSE
      targets_display := 'See Description';
    END IF;
  END;
  
  -- Build formatted output for degen calls
  formatted_text := format(
    '🚨 DEGEN CALL ALERT 🚨

💎 %s %s %s %s

🎯 Entry: %s
❌ Stop Loss: %s
🚀 Targets: %s
⚖️ Risk: %s%%

📝 %s

🔥 This is a DEGEN CALL - Trade at your own risk!
📈 Not financial advice - DYOR!',
    UPPER(signal_row.market::TEXT),
    UPPER(signal_row.ticker),
    UPPER(signal_row.entry_type::TEXT),
    UPPER(signal_row.trade_direction::TEXT),
    entry_display,
    invalidation_display,
    targets_display,
    signal_row.risk_percentage,
    signal_row.full_description
  );
  
  RETURN formatted_text;
END;
$function$;
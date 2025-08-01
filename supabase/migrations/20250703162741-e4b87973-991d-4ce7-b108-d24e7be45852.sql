-- Fix format_degen_call_message function to handle both string and JSONB targets
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
    -- Try to parse as JSONB if it's a string
    IF jsonb_typeof(signal_row.targets) = 'string' THEN
      targets_json := signal_row.targets #>> '{}' ::jsonb;
    ELSE
      targets_json := signal_row.targets;
    END IF;
    
    -- Check if we have valid targets
    IF targets_json IS NOT NULL AND jsonb_array_length(targets_json) > 0 THEN
      SELECT string_agg(value::TEXT, ', ') INTO targets_display
      FROM jsonb_array_elements_text(targets_json);
    ELSE
      targets_display := 'See Description';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If JSON parsing fails, try to extract from string format
    IF signal_row.targets IS NOT NULL THEN
      -- Handle string format like '["0.15", "0.16"]'
      SELECT string_agg(
        trim(both '"' from regexp_split_to_table(
          regexp_replace(signal_row.targets::TEXT, '[\[\]]', '', 'g'), 
          ','
        )), 
        ', '
      ) INTO targets_display;
      
      IF targets_display IS NULL OR targets_display = '' THEN
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
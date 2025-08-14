-- Improve the degen call message formatting
CREATE OR REPLACE FUNCTION format_degen_call_message(signal_row analyst_signals)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  formatted_text TEXT;
  entry_display TEXT;
  invalidation_display TEXT;
  targets_display TEXT;
  targets_json JSONB;
  targets_string TEXT;
  size_display TEXT;
  risk_display TEXT;
BEGIN
  -- Format entry price
  IF signal_row.entry_price IS NOT NULL THEN
    entry_display := '$' || signal_row.entry_price::TEXT;
  ELSE
    entry_display := 'Market';
  END IF;
  
  -- Format stop loss
  IF signal_row.stop_loss_price IS NOT NULL THEN
    invalidation_display := '$' || signal_row.stop_loss_price::TEXT;
  ELSE
    invalidation_display := 'N/A';
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
      SELECT '$' || string_agg(value::TEXT, ', $') INTO targets_display
      FROM jsonb_array_elements_text(targets_json);
    ELSE
      targets_display := 'N/A';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    targets_display := 'N/A';
  END;
  
  -- Format size from entry_conditions
  size_display := COALESCE(signal_row.entry_conditions, 'N/A');
  
  -- Format risk percentage
  risk_display := signal_row.risk_percentage::TEXT || '%';
  
  -- Build nicely formatted output for degen calls
  formatted_text := format(
    '🚨 <b>DEGEN CALL ALERT</b> 🚨

💎 <b>%s %s</b> %s

🎯 <b>Entry:</b> %s
❌ <b>Stop Loss:</b> %s  
🚀 <b>Targets:</b> %s
📏 <b>Size:</b> %s
⚖️ <b>Risk:</b> %s

👤 <b>Called by:</b> %s

⚠️ <i>This is a DEGEN CALL - Trade at your own risk!</i>
📈 <i>Not financial advice - DYOR!</i>',
    UPPER(signal_row.ticker),
    UPPER(signal_row.trade_direction::TEXT),
    CASE WHEN signal_row.trade_direction = 'long' THEN '📈' ELSE '📉' END,
    entry_display,
    invalidation_display,
    targets_display,
    size_display,
    risk_display,
    COALESCE(signal_row.analyst_name, 'Unknown')
  );
  
  RETURN formatted_text;
END;
$$;
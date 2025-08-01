
-- Update analyst_channel_config for new chat ID
INSERT INTO public.analyst_channel_config (
  chat_id,
  channel_name,
  analyst_id,
  is_monitoring_enabled,
  auto_process_calls,
  min_confidence_threshold
) VALUES (
  -1002083186778,
  'New Telegram Group',
  (SELECT id FROM analysts WHERE name = 'General' LIMIT 1),
  true,
  false,
  0.75
) ON CONFLICT (chat_id) DO UPDATE SET
  is_monitoring_enabled = EXCLUDED.is_monitoring_enabled,
  updated_at = now();

-- Create command sessions table for tracking !degen commands
CREATE TABLE IF NOT EXISTS public.command_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_type TEXT NOT NULL DEFAULT 'degen',
  trigger_message_id UUID REFERENCES telegram_messages(id),
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  session_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end_time TIMESTAMP WITH TIME ZONE,
  collected_messages UUID[] DEFAULT '{}',
  aggregated_content TEXT,
  detection_status TEXT DEFAULT 'collecting', -- collecting, analyzing, completed, failed
  analyst_signal_id UUID REFERENCES analyst_signals(id),
  confidence_score NUMERIC DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for command_sessions
ALTER TABLE public.command_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "command_sessions_admin_full" ON public.command_sessions
  FOR ALL USING (is_current_user_admin_fast())
  WITH CHECK (is_current_user_admin_fast());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_command_sessions_chat_id ON public.command_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_command_sessions_status ON public.command_sessions(detection_status);
CREATE INDEX IF NOT EXISTS idx_command_sessions_created_at ON public.command_sessions(created_at);

-- Add new detection patterns for commands and structured format
INSERT INTO public.analyst_call_patterns (
  pattern_name,
  pattern_regex,
  analyst_id,
  extraction_config,
  priority,
  is_active
) VALUES 
(
  'Degen Command Trigger',
  '(?i)!degen\b',
  (SELECT id FROM analysts WHERE name = 'General' LIMIT 1),
  '{"type": "command", "collect_next_messages": 5, "timeout_minutes": 10}',
  10,
  true
),
(
  'Structured Call Format',
  '(?i)\$([A-Z]{2,10})\s+(LONG|SHORT)\s+@\s*\$?([0-9,]+\.?[0-9]*)\s*\|\s*SL:\s*\$?([0-9,]+\.?[0-9]*)\s*\|\s*TP:\s*(.+?)\s*\|\s*Risk:\s*([0-9]+)%',
  (SELECT id FROM analysts WHERE name = 'General' LIMIT 1),
  '{"type": "structured", "format": "symbol_direction_entry_sl_tp_risk"}',
  9,
  true
),
(
  'Natural Language Call',
  '(?i)(buy|sell|long|short)\s+\$?([A-Z]{2,10})',
  (SELECT id FROM analysts WHERE name = 'General' LIMIT 1),
  '{"type": "natural", "requires_context": true}',
  5,
  true
) ON CONFLICT (pattern_name) DO UPDATE SET
  pattern_regex = EXCLUDED.pattern_regex,
  extraction_config = EXCLUDED.extraction_config,
  updated_at = now();

-- Create function to extract structured call data with enhanced parsing
CREATE OR REPLACE FUNCTION public.extract_enhanced_call_data(
  message_text TEXT,
  pattern_config JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  extracted_data JSONB := '{}';
  symbol_match TEXT;
  direction_match TEXT;
  entry_match TEXT;
  stop_loss_match TEXT;
  targets_text TEXT;
  targets_array TEXT[];
  risk_match TEXT;
  structured_match TEXT[];
BEGIN
  -- Try structured format first: $SYMBOL LONG/SHORT @ $ENTRY | SL: $STOPLOSS | TP: $TARGET1, $TARGET2 | Risk: X%
  structured_match := regexp_match(
    message_text, 
    '\$([A-Z]{2,10})\s+(LONG|SHORT)\s+@\s*\$?([0-9,]+\.?[0-9]*)\s*\|\s*SL:\s*\$?([0-9,]+\.?[0-9]*)\s*\|\s*TP:\s*(.+?)\s*\|\s*Risk:\s*([0-9]+)%',
    'i'
  );
  
  IF structured_match IS NOT NULL THEN
    -- Structured format detected
    extracted_data := jsonb_set(extracted_data, '{format_type}', to_jsonb('structured'));
    extracted_data := jsonb_set(extracted_data, '{symbol}', to_jsonb(structured_match[1]));
    extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb(lower(structured_match[2])));
    extracted_data := jsonb_set(extracted_data, '{entry_price}', to_jsonb(replace(structured_match[3], ',', '')::numeric));
    extracted_data := jsonb_set(extracted_data, '{stop_loss_price}', to_jsonb(replace(structured_match[4], ',', '')::numeric));
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(structured_match[6]::integer));
    
    -- Parse targets
    targets_text := structured_match[5];
    targets_array := string_to_array(replace(targets_text, '$', ''), ',');
    FOR i IN 1..array_length(targets_array, 1) LOOP
      targets_array[i] := trim(targets_array[i]);
    END LOOP;
    extracted_data := jsonb_set(extracted_data, '{targets}', to_jsonb(targets_array));
    
    RETURN extracted_data;
  END IF;
  
  -- Fallback to natural language parsing
  extracted_data := jsonb_set(extracted_data, '{format_type}', to_jsonb('natural'));
  
  -- Extract symbol
  symbol_match := (regexp_match(message_text, '\$?([A-Z]{2,10})', 'i'))[1];
  IF symbol_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{symbol}', to_jsonb(symbol_match));
  END IF;
  
  -- Extract direction
  direction_match := (regexp_match(message_text, '\b(long|short|buy|sell)\b', 'i'))[1];
  IF direction_match IS NOT NULL THEN
    CASE lower(direction_match)
      WHEN 'buy' THEN extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb('long'));
      WHEN 'sell' THEN extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb('short'));
      ELSE extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb(lower(direction_match)));
    END CASE;
  ELSE
    extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb('long'));
  END IF;
  
  -- Extract entry price
  entry_match := (regexp_match(message_text, '(?:entry|@|buy)\s*:?\s*\$?([0-9,]+\.?[0-9]*)', 'i'))[1];
  IF entry_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{entry_price}', to_jsonb(replace(entry_match, ',', '')::numeric));
  END IF;
  
  -- Extract stop loss
  stop_loss_match := (regexp_match(message_text, '(?:sl|stop|stop loss)\s*:?\s*\$?([0-9,]+\.?[0-9]*)', 'i'))[1];
  IF stop_loss_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{stop_loss_price}', to_jsonb(replace(stop_loss_match, ',', '')::numeric));
  END IF;
  
  -- Extract risk percentage
  risk_match := (regexp_match(message_text, '(?:risk|r)\s*:?\s*([0-9]+)\s*%', 'i'))[1];
  IF risk_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(risk_match::integer));
  ELSE
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(2));
  END IF;
  
  -- Set defaults
  extracted_data := jsonb_set(extracted_data, '{market}', to_jsonb('crypto'));
  extracted_data := jsonb_set(extracted_data, '{entry_type}', to_jsonb('market'));
  
  RETURN extracted_data;
END;
$$;

-- Create function to calculate enhanced confidence scores
CREATE OR REPLACE FUNCTION public.calculate_enhanced_confidence(
  message_text TEXT,
  extracted_data JSONB,
  format_type TEXT DEFAULT 'natural'
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  confidence NUMERIC := 0.0;
  has_symbol BOOLEAN := false;
  has_direction BOOLEAN := false;
  has_entry BOOLEAN := false;
  has_targets BOOLEAN := false;
  has_stop_loss BOOLEAN := false;
  has_risk BOOLEAN := false;
BEGIN
  -- Check for required fields
  has_symbol := extracted_data ? 'symbol' AND extracted_data->>'symbol' IS NOT NULL;
  has_direction := extracted_data ? 'trade_direction' AND extracted_data->>'trade_direction' IS NOT NULL;
  has_entry := extracted_data ? 'entry_price' AND extracted_data->>'entry_price' IS NOT NULL;
  has_targets := extracted_data ? 'targets' AND jsonb_array_length(COALESCE(extracted_data->'targets', '[]'::jsonb)) > 0;
  has_stop_loss := extracted_data ? 'stop_loss_price' AND extracted_data->>'stop_loss_price' IS NOT NULL;
  has_risk := extracted_data ? 'risk_percentage' AND extracted_data->>'risk_percentage' IS NOT NULL;
  
  -- Base confidence based on format type
  CASE format_type
    WHEN 'structured' THEN confidence := 0.95; -- High confidence for structured format
    WHEN 'command' THEN confidence := 0.85;    -- High confidence for command-triggered
    WHEN 'natural' THEN confidence := 0.3;     -- Lower base for natural language
    ELSE confidence := 0.1;
  END CASE;
  
  -- Adjust based on available data (for natural language parsing)
  IF format_type = 'natural' THEN
    IF has_symbol THEN confidence := confidence + 0.2; END IF;
    IF has_direction THEN confidence := confidence + 0.15; END IF;
    IF has_entry THEN confidence := confidence + 0.2; END IF;
    IF has_targets THEN confidence := confidence + 0.1; END IF;
    IF has_stop_loss THEN confidence := confidence + 0.15; END IF;
    IF has_risk THEN confidence := confidence + 0.05; END IF;
  END IF;
  
  -- Cap at 1.0
  IF confidence > 1.0 THEN confidence := 1.0; END IF;
  
  RETURN confidence;
END;
$$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_command_sessions_updated_at
  BEFORE UPDATE ON public.command_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

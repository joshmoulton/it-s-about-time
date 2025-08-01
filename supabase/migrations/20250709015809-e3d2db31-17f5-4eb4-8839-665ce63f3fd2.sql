-- Create table for analyst call patterns and configuration
CREATE TABLE public.analyst_call_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analyst_id UUID REFERENCES public.analysts(id),
  pattern_name TEXT NOT NULL,
  pattern_regex TEXT NOT NULL,
  extraction_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking detected analyst calls
CREATE TABLE public.analyst_call_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id UUID REFERENCES public.telegram_messages(id),
  pattern_id UUID REFERENCES public.analyst_call_patterns(id),
  extracted_data JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  auto_processed BOOLEAN NOT NULL DEFAULT false,
  requires_review BOOLEAN NOT NULL DEFAULT true,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  analyst_signal_id UUID REFERENCES public.analyst_signals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for analyst channel monitoring configuration
CREATE TABLE public.analyst_channel_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  channel_name TEXT,
  analyst_id UUID REFERENCES public.analysts(id),
  is_monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_process_calls BOOLEAN NOT NULL DEFAULT false,
  min_confidence_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyst_call_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyst_call_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyst_channel_config ENABLE ROW LEVEL SECURITY;

-- Create policies for analyst_call_patterns
CREATE POLICY "Admins can manage analyst call patterns" 
ON public.analyst_call_patterns 
FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Anyone can view active patterns" 
ON public.analyst_call_patterns 
FOR SELECT
USING (is_active = true);

-- Create policies for analyst_call_detections
CREATE POLICY "Admins can manage analyst call detections" 
ON public.analyst_call_detections 
FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Service role can create detections" 
ON public.analyst_call_detections 
FOR INSERT
WITH CHECK (true);

-- Create policies for analyst_channel_config
CREATE POLICY "Admins can manage channel config" 
ON public.analyst_channel_config 
FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Service role can read channel config" 
ON public.analyst_channel_config 
FOR SELECT
USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_analyst_call_patterns_updated_at
BEFORE UPDATE ON public.analyst_call_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyst_call_detections_updated_at
BEFORE UPDATE ON public.analyst_call_detections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyst_channel_config_updated_at
BEFORE UPDATE ON public.analyst_channel_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to extract trading data from message text
CREATE OR REPLACE FUNCTION public.extract_analyst_call_data(
  message_text TEXT,
  pattern_config JSONB
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  extracted_data JSONB := '{}';
  symbol_match TEXT;
  entry_match TEXT;
  stop_loss_match TEXT;
  targets_match TEXT[];
  position_type_match TEXT;
  risk_match TEXT;
BEGIN
  -- Extract symbol/ticker (look for common patterns like $BTC, BTC, etc.)
  symbol_match := (regexp_match(message_text, '\$?([A-Z]{2,10})', 'i'))[1];
  IF symbol_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{symbol}', to_jsonb(symbol_match));
  END IF;
  
  -- Extract entry price (look for patterns like "Entry: 50000", "@ 50k", etc.)
  entry_match := (regexp_match(message_text, '(?:entry|@|buy)\s*:?\s*\$?([0-9,]+\.?[0-9]*)', 'i'))[1];
  IF entry_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{entry_price}', to_jsonb(replace(entry_match, ',', '')::numeric));
  END IF;
  
  -- Extract stop loss (look for patterns like "SL: 45000", "Stop: 45k", etc.)
  stop_loss_match := (regexp_match(message_text, '(?:sl|stop|stop loss)\s*:?\s*\$?([0-9,]+\.?[0-9]*)', 'i'))[1];
  IF stop_loss_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{stop_loss_price}', to_jsonb(replace(stop_loss_match, ',', '')::numeric));
  END IF;
  
  -- Extract position type (long/short)
  position_type_match := (regexp_match(message_text, '\b(long|short)\b', 'i'))[1];
  IF position_type_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb(lower(position_type_match)));
  ELSE
    -- Default to long if not specified
    extracted_data := jsonb_set(extracted_data, '{trade_direction}', to_jsonb('long'));
  END IF;
  
  -- Extract targets (look for patterns like "TP1: 55000, TP2: 60000")
  SELECT array_agg(replace(match_group, ',', '')::numeric ORDER BY ordinality)
  INTO targets_match
  FROM regexp_split_to_table(
    (regexp_match(message_text, '(?:tp|target|take profit)s?\s*:?\s*([\d,.\s]+)', 'i'))[1], 
    '\s+'
  ) WITH ORDINALITY AS t(match_group, ordinality)
  WHERE match_group ~ '^[0-9,]+\.?[0-9]*$';
  
  IF targets_match IS NOT NULL AND array_length(targets_match, 1) > 0 THEN
    extracted_data := jsonb_set(extracted_data, '{targets}', to_jsonb(targets_match));
  END IF;
  
  -- Extract risk percentage
  risk_match := (regexp_match(message_text, '(?:risk|r)\s*:?\s*([0-9]+)\s*%', 'i'))[1];
  IF risk_match IS NOT NULL THEN
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(risk_match::integer));
  ELSE
    extracted_data := jsonb_set(extracted_data, '{risk_percentage}', to_jsonb(2)); -- Default 2% risk
  END IF;
  
  -- Set market type (default to crypto for now)
  extracted_data := jsonb_set(extracted_data, '{market}', to_jsonb('crypto'));
  
  -- Set entry type (default to market)
  extracted_data := jsonb_set(extracted_data, '{entry_type}', to_jsonb('market'));
  
  RETURN extracted_data;
END;
$function$;

-- Create function to calculate confidence score for analyst call detection
CREATE OR REPLACE FUNCTION public.calculate_detection_confidence(
  message_text TEXT,
  extracted_data JSONB
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  confidence_score NUMERIC := 0.0;
  total_criteria INTEGER := 5;
  met_criteria INTEGER := 0;
BEGIN
  -- Check if symbol is present
  IF extracted_data ? 'symbol' AND extracted_data->>'symbol' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if entry price is present
  IF extracted_data ? 'entry_price' AND extracted_data->>'entry_price' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if stop loss is present
  IF extracted_data ? 'stop_loss_price' AND extracted_data->>'stop_loss_price' IS NOT NULL THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if targets are present
  IF extracted_data ? 'targets' AND jsonb_array_length(extracted_data->'targets') > 0 THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  -- Check if position type is identified
  IF extracted_data ? 'trade_direction' AND extracted_data->>'trade_direction' IN ('long', 'short') THEN
    met_criteria := met_criteria + 1;
  END IF;
  
  confidence_score := (met_criteria::NUMERIC / total_criteria::NUMERIC);
  
  RETURN ROUND(confidence_score, 2);
END;
$function$;
-- Create function to extract analyst call data
CREATE OR REPLACE FUNCTION public.extract_analyst_call_data(
  message_text text,
  pattern_config jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb := '{}';
  ticker_match text;
  entry_match text;
  stop_match text;
  target_match text;
  risk_match text;
  close_match text;
BEGIN
  -- Check if this is a close command
  IF message_text ~* '^!close\s+([A-Za-z]+)' THEN
    -- Extract ticker from close command
    SELECT (regexp_matches(message_text, '!close\s+([A-Za-z]+)', 'i'))[1] INTO ticker_match;
    
    result := jsonb_build_object(
      'type', 'close_command',
      'ticker', UPPER(ticker_match),
      'symbol', UPPER(ticker_match),
      'action', 'close'
    );
    
    RETURN result;
  END IF;
  
  -- Regular degen call pattern matching
  IF message_text ~* '!degen\s+' THEN
    -- Extract ticker (with or without $)
    SELECT (regexp_matches(message_text, '!degen\s+\$?([A-Za-z]{2,10})', 'i'))[1] INTO ticker_match;
    
    -- Extract entry price
    SELECT (regexp_matches(message_text, 'entry\s+([0-9]+(?:\.[0-9]+)?)', 'i'))[1] INTO entry_match;
    
    -- Extract stop loss
    SELECT (regexp_matches(message_text, 'stop\s+([0-9]+(?:\.[0-9]+)?)', 'i'))[1] INTO stop_match;
    
    -- Extract target
    SELECT (regexp_matches(message_text, 'target\s+([0-9]+(?:\.[0-9]+)?)', 'i'))[1] INTO target_match;
    
    -- Extract risk
    SELECT (regexp_matches(message_text, 'risk\s+([A-Za-z]+|[0-9]+(?:\.[0-9]+)?%?)', 'i'))[1] INTO risk_match;
    
    -- Build result
    result := jsonb_build_object(
      'type', 'degen_call',
      'ticker', UPPER(ticker_match),
      'symbol', UPPER(ticker_match),
      'entry_price', CASE WHEN entry_match IS NOT NULL THEN entry_match::numeric ELSE NULL END,
      'stop_loss_price', CASE WHEN stop_match IS NOT NULL THEN stop_match::numeric ELSE NULL END,
      'targets', CASE WHEN target_match IS NOT NULL THEN jsonb_build_array(target_match::numeric) ELSE '[]'::jsonb END,
      'risk_percentage', CASE 
        WHEN risk_match = 'low' THEN 1.0
        WHEN risk_match = 'medium' THEN 2.0  
        WHEN risk_match = 'high' THEN 5.0
        WHEN risk_match ~ '^[0-9]+' THEN regexp_replace(risk_match, '%', '')::numeric
        ELSE 2.0
      END,
      'trade_direction', 'long',
      'entry_type', 'market',
      'market', 'crypto'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to calculate detection confidence
CREATE OR REPLACE FUNCTION public.calculate_detection_confidence(
  message_text text,
  extracted_data jsonb DEFAULT '{}'::jsonb
)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  confidence numeric := 0;
  data_type text;
BEGIN
  data_type := extracted_data->>'type';
  
  -- Close commands have high confidence if they match the pattern
  IF data_type = 'close_command' THEN
    IF extracted_data->>'ticker' IS NOT NULL THEN
      RETURN 1.0;
    ELSE
      RETURN 0.0;
    END IF;
  END IF;
  
  -- Degen calls confidence based on completeness
  IF data_type = 'degen_call' THEN
    confidence := 0.3; -- Base confidence for matching pattern
    
    -- Add confidence for each required field
    IF extracted_data->>'ticker' IS NOT NULL THEN
      confidence := confidence + 0.4;
    END IF;
    
    IF extracted_data->>'entry_price' IS NOT NULL THEN
      confidence := confidence + 0.1;
    END IF;
    
    IF extracted_data->>'stop_loss_price' IS NOT NULL THEN
      confidence := confidence + 0.1;
    END IF;
    
    IF (extracted_data->'targets')::jsonb != '[]'::jsonb THEN
      confidence := confidence + 0.1;
    END IF;
  END IF;
  
  RETURN LEAST(confidence, 1.0);
END;
$$;
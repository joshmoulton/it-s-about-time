
-- Create enum types for the analyst signals
CREATE TYPE market_type AS ENUM ('crypto', 'stocks', 'commodities', 'forex');
CREATE TYPE trade_type AS ENUM ('spot', 'futures', 'options');
CREATE TYPE trade_direction AS ENUM ('buy', 'long', 'short', 'call', 'put', 'bull', 'bear');
CREATE TYPE entry_type AS ENUM ('limit', 'market', 'trigger', 'conditional');
CREATE TYPE risk_management_type AS ENUM ('stop_loss', 'conditional');

-- Create the analyst_signals table
CREATE TABLE public.analyst_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  analyst_name TEXT NOT NULL,
  analyst_photo_url TEXT,
  
  -- Trade classification
  market market_type NOT NULL,
  trade_type trade_type NOT NULL,
  trade_direction trade_direction NOT NULL,
  
  -- Trade details
  ticker TEXT NOT NULL,
  risk_percentage DECIMAL(5,2) NOT NULL CHECK (risk_percentage > 0 AND risk_percentage <= 100),
  entry_type entry_type NOT NULL,
  entry_price DECIMAL(20,8),
  entry_conditions TEXT, -- For conditional/trigger entries
  
  -- Risk management
  risk_management risk_management_type NOT NULL,
  stop_loss_price DECIMAL(20,8),
  stop_loss_conditions TEXT, -- For conditional stops
  
  -- Targets
  targets JSONB DEFAULT '[]', -- Array of target prices/descriptions
  
  -- Content
  full_description TEXT NOT NULL,
  formatted_output TEXT, -- Auto-generated formatted text
  
  -- Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  posted_to_telegram BOOLEAN DEFAULT false,
  telegram_message_id BIGINT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.analyst_signals ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all signals
CREATE POLICY "Admin users can manage analyst signals" 
  ON public.analyst_signals 
  FOR ALL 
  USING (is_current_user_admin());

-- Policy for authenticated users to view active signals
CREATE POLICY "Users can view active analyst signals" 
  ON public.analyst_signals 
  FOR SELECT 
  USING (status = 'active');

-- Add updated_at trigger
CREATE TRIGGER update_analyst_signals_updated_at
  BEFORE UPDATE ON public.analyst_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate formatted output
CREATE OR REPLACE FUNCTION generate_signal_format(signal_row analyst_signals)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  formatted_text TEXT;
  entry_display TEXT;
  invalidation_display TEXT;
  targets_display TEXT;
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
  
  -- Format targets
  IF signal_row.targets IS NOT NULL AND jsonb_array_length(signal_row.targets) > 0 THEN
    SELECT string_agg(value::TEXT, ', ') INTO targets_display
    FROM jsonb_array_elements_text(signal_row.targets);
  ELSE
    targets_display := 'See Description';
  END IF;
  
  -- Build formatted output
  formatted_text := format(
    'MARKET: %s %s %s %s

Entry: %s
Invalidation: %s
Targets: %s

Risk: %s%%

%s',
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
$$;

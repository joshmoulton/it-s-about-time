-- Create table to track degen call subscriptions
CREATE TABLE public.degen_call_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.degen_call_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own degen subscriptions" 
ON public.degen_call_subscriptions 
FOR ALL
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can manage all degen subscriptions" 
ON public.degen_call_subscriptions 
FOR ALL
USING (is_current_user_admin());

-- Create table to track sent degen calls
CREATE TABLE public.degen_call_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analyst_signal_id UUID NOT NULL REFERENCES public.analyst_signals(id),
  telegram_message_id BIGINT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.degen_call_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Admins can view degen call notifications" 
ON public.degen_call_notifications 
FOR SELECT
USING (is_current_user_admin());

-- Add trigger to update timestamps
CREATE TRIGGER update_degen_subscriptions_updated_at
BEFORE UPDATE ON public.degen_call_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to format degen call message
CREATE OR REPLACE FUNCTION public.format_degen_call_message(signal_row analyst_signals)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $function$
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
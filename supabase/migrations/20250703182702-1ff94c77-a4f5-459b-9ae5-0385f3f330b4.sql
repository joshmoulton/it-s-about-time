-- Create table for analyst-specific degen call subscriptions
CREATE TABLE public.analyst_degen_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  analyst_name TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_email, analyst_name)
);

-- Enable RLS
ALTER TABLE public.analyst_degen_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analyst subscriptions" 
ON public.analyst_degen_subscriptions 
FOR SELECT 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own analyst subscriptions" 
ON public.analyst_degen_subscriptions 
FOR INSERT 
WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update their own analyst subscriptions" 
ON public.analyst_degen_subscriptions 
FOR UPDATE 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can delete their own analyst subscriptions" 
ON public.analyst_degen_subscriptions 
FOR DELETE 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can view all analyst subscriptions" 
ON public.analyst_degen_subscriptions 
FOR SELECT 
USING (is_current_user_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_analyst_degen_subscriptions_updated_at
BEFORE UPDATE ON public.analyst_degen_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create degen_call_subscriptions table
CREATE TABLE public.degen_call_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_email)
);

-- Enable RLS
ALTER TABLE public.degen_call_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for degen_call_subscriptions
CREATE POLICY "Users can view their own degen call subscription" 
ON public.degen_call_subscriptions 
FOR SELECT 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own degen call subscription" 
ON public.degen_call_subscriptions 
FOR INSERT 
WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update their own degen call subscription" 
ON public.degen_call_subscriptions 
FOR UPDATE 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can view all degen call subscriptions" 
ON public.degen_call_subscriptions 
FOR ALL
USING (is_current_user_admin());

-- Add trigger to update timestamps
CREATE TRIGGER update_degen_call_subscriptions_updated_at
BEFORE UPDATE ON public.degen_call_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
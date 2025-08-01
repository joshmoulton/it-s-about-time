-- Create subscriptions table for Telegram bot user subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL,
  admin_id BIGINT NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add composite unique constraint to prevent duplicates
ALTER TABLE public.subscriptions 
ADD CONSTRAINT unique_user_admin_subscription 
UNIQUE (user_id, admin_id);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for the subscriptions table
CREATE POLICY "Enable read access for all users" ON public.subscriptions
FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.subscriptions  
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON public.subscriptions
FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
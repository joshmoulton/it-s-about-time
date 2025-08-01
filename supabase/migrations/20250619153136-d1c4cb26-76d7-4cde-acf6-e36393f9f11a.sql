
-- Create table to track Telegram community access
CREATE TABLE public.telegram_community_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  whop_purchase_id TEXT,
  access_granted_at TIMESTAMP WITH TIME ZONE,
  access_revoked_at TIMESTAMP WITH TIME ZONE,
  access_status TEXT NOT NULL DEFAULT 'pending', -- pending, granted, revoked
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to log gatekeeper actions
CREATE TABLE public.gatekeeper_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- grant_access, revoke_access, webhook_received
  whop_purchase_id TEXT,
  telegram_user_id BIGINT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_community_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gatekeeper_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow authenticated users to view community access" 
  ON public.telegram_community_access 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to view gatekeeper logs" 
  ON public.gatekeeper_logs 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_telegram_access_email ON public.telegram_community_access(user_email);
CREATE INDEX idx_telegram_access_user_id ON public.telegram_community_access(telegram_user_id);
CREATE INDEX idx_telegram_access_purchase_id ON public.telegram_community_access(whop_purchase_id);
CREATE INDEX idx_gatekeeper_logs_email ON public.gatekeeper_logs(user_email);

-- Add trigger to update updated_at column
CREATE TRIGGER update_telegram_community_access_updated_at
  BEFORE UPDATE ON public.telegram_community_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

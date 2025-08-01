
-- Create trading_alerts table for storing real trading data
CREATE TABLE public.trading_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  strike_price numeric NOT NULL,
  expiry_date date NOT NULL,
  option_type text NOT NULL CHECK (option_type IN ('call', 'put')),
  entry_price numeric NOT NULL,
  current_price numeric,
  profit_loss numeric DEFAULT 0,
  profit_percentage numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.trading_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for trading_alerts
CREATE POLICY "Users can view their own trading alerts" 
  ON public.trading_alerts 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own trading alerts" 
  ON public.trading_alerts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading alerts" 
  ON public.trading_alerts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading alerts" 
  ON public.trading_alerts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_trading_alerts_user_id ON public.trading_alerts(user_id);
CREATE INDEX idx_trading_alerts_status ON public.trading_alerts(status);
CREATE INDEX idx_trading_alerts_created_at ON public.trading_alerts(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_trading_alerts_updated_at 
  BEFORE UPDATE ON public.trading_alerts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();


-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'paid', 'premium');

-- Create subscription tiers configuration table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create beehiiv subscribers table
CREATE TABLE public.beehiiv_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beehiiv_subscriber_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL, -- active, unsubscribed, etc.
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user sessions table
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.beehiiv_subscribers(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beehiiv_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers (public read access)
CREATE POLICY "Anyone can view subscription tiers"
  ON public.subscription_tiers
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for beehiiv_subscribers
CREATE POLICY "Users can view their own subscriber data"
  ON public.beehiiv_subscribers
  FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM public.beehiiv_subscribers 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (tier, name, description, features) VALUES
('free', 'Free', 'Access to basic content', '["basic_articles", "weekly_newsletter"]'::jsonb),
('paid', 'Paid', 'Access to premium content', '["basic_articles", "weekly_newsletter", "premium_articles", "exclusive_content"]'::jsonb),
('premium', 'Premium', 'Full access to all content', '["basic_articles", "weekly_newsletter", "premium_articles", "exclusive_content", "community_access", "1on1_sessions"]'::jsonb);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for beehiiv_subscribers
CREATE TRIGGER update_beehiiv_subscribers_updated_at 
  BEFORE UPDATE ON public.beehiiv_subscribers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

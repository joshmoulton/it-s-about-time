-- Create user_sessions table for enhanced authentication

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id uuid NOT NULL REFERENCES public.beehiiv_subscribers(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  auth_method text NOT NULL,
  whop_user_id text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (subscriber_id IN (
  SELECT id FROM public.beehiiv_subscribers 
  WHERE email = get_current_user_email()
));

CREATE POLICY "Sessions can be created by system" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (true);

-- Create whop_authenticated_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.whop_authenticated_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  whop_user_id text NOT NULL,
  whop_purchase_id text,
  subscription_tier subscription_tier NOT NULL DEFAULT 'premium',
  last_verified_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_email, whop_user_id)
);

-- Enable RLS on whop_authenticated_users
ALTER TABLE public.whop_authenticated_users ENABLE ROW LEVEL SECURITY;

-- Create policies for whop_authenticated_users
CREATE POLICY "Users can view their own whop records" 
ON public.whop_authenticated_users 
FOR SELECT 
USING (user_email = get_current_user_email());

CREATE POLICY "Whop records can be managed by system" 
ON public.whop_authenticated_users 
FOR ALL 
USING (true)
WITH CHECK (true);
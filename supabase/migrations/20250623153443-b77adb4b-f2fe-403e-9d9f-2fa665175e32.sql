
-- Add password and authentication fields to beehiiv_subscribers table
ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN password_hash text,
ADD COLUMN requires_password_setup boolean DEFAULT true,
ADD COLUMN last_login_at timestamp with time zone,
ADD COLUMN login_attempts integer DEFAULT 0,
ADD COLUMN locked_until timestamp with time zone,
ADD COLUMN password_reset_token text,
ADD COLUMN password_reset_expires_at timestamp with time zone;

-- Create table for Whop authenticated users
CREATE TABLE public.whop_authenticated_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  whop_user_id text NOT NULL,
  whop_purchase_id text NOT NULL,
  subscription_tier subscription_tier NOT NULL DEFAULT 'paid',
  access_granted_at timestamp with time zone NOT NULL DEFAULT now(),
  access_expires_at timestamp with time zone,
  last_verified_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_email),
  UNIQUE(whop_user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.whop_authenticated_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whop_authenticated_users
CREATE POLICY "Users can view their own whop auth record" 
  ON public.whop_authenticated_users 
  FOR SELECT 
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create authentication audit log table
CREATE TABLE public.authentication_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  auth_method text NOT NULL, -- 'password', 'whop', 'admin'
  action_type text NOT NULL, -- 'login_success', 'login_failed', 'password_reset', 'account_locked'
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log (admin only access)
ALTER TABLE public.authentication_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to audit logs
CREATE POLICY "Admins can view all audit logs" 
  ON public.authentication_audit_log 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id 
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND au.is_active = TRUE
    )
  );

-- Update user_sessions table to support different auth types
ALTER TABLE public.user_sessions 
ADD COLUMN auth_method text DEFAULT 'beehiiv',
ADD COLUMN whop_user_id text,
ADD COLUMN last_activity_at timestamp with time zone DEFAULT now();

-- Create function to hash passwords (using pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Minimum 8 characters, at least one letter and one number
  RETURN length(password) >= 8 
    AND password ~ '[A-Za-z]' 
    AND password ~ '[0-9]';
END;
$$;

-- Create function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_email text,
  p_auth_method text,
  p_action_type text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.authentication_audit_log (
    user_email, auth_method, action_type, ip_address, user_agent, metadata
  ) VALUES (
    p_user_email, p_auth_method, p_action_type, p_ip_address, p_user_agent, p_metadata
  );
END;
$$;

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  locked_until_time timestamp with time zone;
BEGIN
  SELECT locked_until INTO locked_until_time
  FROM public.beehiiv_subscribers
  WHERE email = p_email;
  
  RETURN locked_until_time IS NOT NULL AND locked_until_time > now();
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_whop_authenticated_users_updated_at
  BEFORE UPDATE ON public.whop_authenticated_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

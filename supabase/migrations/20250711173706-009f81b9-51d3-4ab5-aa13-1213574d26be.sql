-- Add missing columns to beehiiv_subscribers table for enhanced authentication

ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS requires_password_setup boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS beta_user boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS beta_access_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS beta_access_granted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS password_reset_token text,
ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamp with time zone;
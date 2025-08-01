-- Add automatic session cleanup job
SELECT cron.schedule(
    'cleanup-expired-sessions',
    '0 */4 * * *', -- Every 4 hours
    'SELECT cleanup_expired_sessions(); SELECT cleanup_expired_admin_sessions();'
);

-- Add function to clean up expired password reset tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.beehiiv_subscribers 
  SET 
    password_reset_token = NULL,
    password_reset_expires_at = NULL
  WHERE password_reset_expires_at < now();
END;
$$;

-- Add cleanup for expired reset tokens to the scheduled job
SELECT cron.schedule(
    'cleanup-expired-reset-tokens',
    '0 */2 * * *', -- Every 2 hours
    'SELECT cleanup_expired_reset_tokens();'
);

-- Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    email TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on auth_rate_limits
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for rate limits (admin access only)
CREATE POLICY "auth_rate_limits_admin_access" 
ON public.auth_rate_limits 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Add cleanup for rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_auth_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up old rate limit entries (older than 24 hours)
  DELETE FROM public.auth_rate_limits 
  WHERE window_start < now() - INTERVAL '24 hours';
  
  -- Reset blocked entries past their block time
  UPDATE public.auth_rate_limits 
  SET blocked_until = NULL 
  WHERE blocked_until IS NOT NULL AND blocked_until < now();
END;
$$;

-- Schedule rate limit cleanup
SELECT cron.schedule(
    'cleanup-auth-rate-limits',
    '0 1 * * *', -- Daily at 1 AM
    'SELECT cleanup_auth_rate_limits();'
);
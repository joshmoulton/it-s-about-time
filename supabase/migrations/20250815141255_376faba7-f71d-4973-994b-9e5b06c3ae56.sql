-- Create magic link idempotency table for preventing duplicate requests
CREATE TABLE IF NOT EXISTS public.magic_link_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL,
    email TEXT NOT NULL,
    request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    response_data JSONB,
    status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour')
);

-- Create index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_magic_link_idempotency_key 
ON public.magic_link_idempotency(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_magic_link_idempotency_email_timestamp 
ON public.magic_link_idempotency(email, request_timestamp);

CREATE INDEX IF NOT EXISTS idx_magic_link_idempotency_expires 
ON public.magic_link_idempotency(expires_at);

-- Enable RLS
ALTER TABLE public.magic_link_idempotency ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for edge functions
CREATE POLICY "Service role full access" 
ON public.magic_link_idempotency 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Allow admins to view for debugging
CREATE POLICY "Admin read access" 
ON public.magic_link_idempotency 
FOR SELECT 
TO authenticated
USING (is_current_user_admin_fast());

-- Function to cleanup expired idempotency records
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.magic_link_idempotency 
  WHERE expires_at < now();
END;
$function$;

-- Add cleanup to existing cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_all_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Clean up expired user sessions
    DELETE FROM user_sessions 
    WHERE expires_at < now();
    
    -- Clean up expired secure sessions
    DELETE FROM admin_secure_sessions 
    WHERE expires_at < now() OR (last_activity_at < now() - INTERVAL '24 hours');
    
    -- Clean up old rate limit entries
    DELETE FROM auth_rate_limits 
    WHERE window_start < now() - INTERVAL '24 hours';
    
    -- Reset blocked entries past their block time
    UPDATE auth_rate_limits 
    SET blocked_until = NULL 
    WHERE blocked_until IS NOT NULL AND blocked_until < now();
    
    -- Clean up old authentication audit logs (keep 90 days)
    DELETE FROM authentication_audit_log 
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- Clean up expired idempotency records
    DELETE FROM magic_link_idempotency 
    WHERE expires_at < now();
END;
$function$;
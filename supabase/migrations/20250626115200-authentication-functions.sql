
-- Authentication and Password Related Functions

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Minimum 8 characters, at least one letter and one number
  RETURN length(password) >= 8 
    AND password ~ '[A-Za-z]' 
    AND password ~ '[0-9]';
END;
$$;

-- Fix log_auth_event function
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_email text, 
  p_auth_method text, 
  p_action_type text, 
  p_ip_address text DEFAULT NULL::text, 
  p_user_agent text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  INSERT INTO public.authentication_audit_log (
    user_email, auth_method, action_type, ip_address, user_agent, metadata
  ) VALUES (
    p_user_email, p_auth_method, p_action_type, p_ip_address, p_user_agent, p_metadata
  );
END;
$$;

-- Fix is_account_locked function
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

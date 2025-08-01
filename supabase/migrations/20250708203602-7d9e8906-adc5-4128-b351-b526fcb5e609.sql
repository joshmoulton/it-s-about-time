-- Configure auth webhook to use custom email function
-- This will redirect auth emails to our custom Resend-based email system

-- Note: This requires manual configuration in Supabase Dashboard
-- The webhook URL should be: https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/auth-emails
-- This needs to be configured in Supabase Dashboard > Authentication > Settings > Email Templates

-- For now, let's create a manual magic link function that works independently
CREATE OR REPLACE FUNCTION public.send_magic_link(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  magic_token text;
  magic_token_hash text;
  expires_at timestamp with time zone;
  user_record record;
BEGIN
  -- Generate magic link token
  magic_token := encode(gen_random_bytes(32), 'base64url');
  magic_token_hash := encode(digest(magic_token, 'sha256'), 'hex');
  expires_at := now() + interval '1 hour';
  
  -- Find or create user record
  SELECT * INTO user_record 
  FROM public.beehiiv_subscribers 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    -- Create new user record for magic link
    INSERT INTO public.beehiiv_subscribers (
      email, 
      status, 
      subscription_tier,
      requires_password_setup,
      magic_link_token,
      magic_link_expires_at
    ) VALUES (
      user_email,
      'active',
      'free',
      true,
      magic_token_hash,
      expires_at
    );
  ELSE
    -- Update existing user with magic link token
    UPDATE public.beehiiv_subscribers 
    SET 
      magic_link_token = magic_token_hash,
      magic_link_expires_at = expires_at
    WHERE email = user_email;
  END IF;
  
  -- Return token for email sending
  RETURN jsonb_build_object(
    'success', true,
    'token', magic_token,
    'token_hash', magic_token_hash,
    'expires_at', expires_at,
    'email', user_email
  );
END;
$$;
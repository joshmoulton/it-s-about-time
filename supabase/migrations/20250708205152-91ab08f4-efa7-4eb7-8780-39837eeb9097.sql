-- Fix the send_magic_link function to preserve existing password setup status
CREATE OR REPLACE FUNCTION public.send_magic_link(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  magic_token text;
  expires_at timestamp with time zone;
  user_record record;
BEGIN
  -- Generate simple magic link token
  magic_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  expires_at := now() + interval '1 hour';
  
  -- Find or create user record
  SELECT * INTO user_record 
  FROM public.beehiiv_subscribers 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    -- Create new user record for magic link (only new users need password setup)
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
      true,  -- Only new users need password setup
      magic_token,
      expires_at
    );
  ELSE
    -- Update existing user with magic link token (preserve existing password setup status)
    UPDATE public.beehiiv_subscribers 
    SET 
      magic_link_token = magic_token,
      magic_link_expires_at = expires_at
      -- DON'T update requires_password_setup for existing users
    WHERE email = user_email;
  END IF;
  
  -- Return token for email sending
  RETURN jsonb_build_object(
    'success', true,
    'token', magic_token,
    'token_hash', magic_token,
    'expires_at', expires_at,
    'email', user_email
  );
END;
$$;
-- Fix create_unified_session function to use correct column names
CREATE OR REPLACE FUNCTION public.create_unified_session(
  p_email text,
  p_session_token text,
  p_tier text,
  p_source text,
  p_expires_at timestamp with time zone
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_id uuid;
  identity_id uuid;
  user_id uuid;
  result jsonb;
BEGIN
  -- Get auth user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- Delete any existing sessions for this user to prevent constraint violations
  DELETE FROM user_sessions 
  WHERE user_id = create_unified_session.user_id;
  
  -- Create unified identity
  INSERT INTO unified_identities (
    email,
    effective_tier,
    effective_role,
    is_beehiiv_subscriber,
    last_verified_at
  ) VALUES (
    p_email,
    p_tier::subscription_tier,
    'user'::app_role,
    true,
    now()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    effective_tier = EXCLUDED.effective_tier,
    is_beehiiv_subscriber = EXCLUDED.is_beehiiv_subscriber,
    last_verified_at = EXCLUDED.last_verified_at
  RETURNING id INTO identity_id;
  
  -- Create the session
  INSERT INTO user_sessions (
    user_id,
    unified_identity_id,
    session_token,
    tier,
    source,
    expires_at
  ) VALUES (
    user_id,
    identity_id,
    p_session_token,
    p_tier,
    p_source,
    p_expires_at
  ) RETURNING id INTO session_id;
  
  result := jsonb_build_object(
    'success', true,
    'session_id', session_id,
    'identity_id', identity_id,
    'effective_role', 'user',
    'effective_tier', p_tier,
    'is_local_admin', false,
    'is_beehiiv_subscriber', true
  );
  
  RETURN result;
END;
$$;
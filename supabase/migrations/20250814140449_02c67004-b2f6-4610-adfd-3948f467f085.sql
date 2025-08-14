-- Fix authentication integration: Create Supabase sessions for Beehiiv-verified users
-- This ensures RLS policies can recognize premium users

-- Create a function to establish Supabase session for Beehiiv users
CREATE OR REPLACE FUNCTION public.create_supabase_session_for_beehiiv_user(
  p_email text,
  p_subscription_tier subscription_tier
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_record record;
  user_uuid uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT * INTO user_record FROM auth.users WHERE email = p_email;
  
  IF NOT FOUND THEN
    -- Generate a UUID for the new user
    user_uuid := gen_random_uuid();
    
    -- Create Supabase auth user for Beehiiv-verified user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      user_uuid,
      'authenticated',
      'authenticated',
      p_email,
      crypt('beehiiv_verified_' || gen_random_uuid()::text, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "beehiiv", "providers": ["beehiiv"]}',
      jsonb_build_object('subscription_tier', p_subscription_tier::text, 'source', 'beehiiv'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    -- Insert into identities table for the beehiiv provider
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at,
      id
    ) VALUES (
      p_email,
      user_uuid,
      jsonb_build_object('email', p_email, 'sub', p_email),
      'beehiiv',
      now(),
      now(),
      now(),
      gen_random_uuid()
    );
    
    SELECT * INTO user_record FROM auth.users WHERE id = user_uuid;
  ELSE
    -- Update existing user metadata
    UPDATE auth.users 
    SET 
      raw_user_meta_data = jsonb_build_object('subscription_tier', p_subscription_tier::text, 'source', 'beehiiv'),
      last_sign_in_at = now(),
      updated_at = now()
    WHERE id = user_record.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_record.id,
    'email', user_record.email,
    'subscription_tier', p_subscription_tier
  );
END;
$$;

-- Create a function that the client can call to establish session context
CREATE OR REPLACE FUNCTION public.establish_beehiiv_session_context(
  p_email text,
  p_subscription_tier subscription_tier
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_uuid uuid;
  session_result jsonb;
BEGIN
  -- First ensure the user exists in auth.users
  SELECT result INTO session_result 
  FROM (SELECT create_supabase_session_for_beehiiv_user(p_email, p_subscription_tier) as result) t;
  
  IF NOT (session_result->>'success')::boolean THEN
    RETURN session_result;
  END IF;
  
  -- Get the user UUID
  user_uuid := (session_result->>'user_id')::uuid;
  
  -- Set the session context for this request
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', user_uuid::text,
      'email', p_email,
      'aud', 'authenticated',
      'role', 'authenticated'
    )::text, 
    true
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_uuid,
    'email', p_email,
    'subscription_tier', p_subscription_tier,
    'session_established', true
  );
END;
$$;
-- Create a function to create Supabase auth session for enhanced auth users
CREATE OR REPLACE FUNCTION public.create_supabase_session_for_enhanced_user(p_email text, p_session_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_record record;
    session_record record;
BEGIN
    -- Validate the session token first
    SELECT us.*, bs.email, bs.subscription_tier
    INTO session_record
    FROM public.user_sessions us
    JOIN public.beehiiv_subscribers bs ON us.subscriber_id = bs.id
    WHERE us.session_token = p_session_token
      AND us.expires_at > now()
      AND bs.email = p_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid session token');
    END IF;
    
    -- Check if user exists in auth.users
    SELECT * INTO user_record FROM auth.users WHERE email = p_email;
    
    IF NOT FOUND THEN
        -- Create Supabase auth user if doesn't exist
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
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            p_email,
            crypt('temp_password_' || gen_random_uuid()::text, gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "enhanced_auth", "providers": ["enhanced_auth"]}',
            jsonb_build_object('subscription_tier', session_record.subscription_tier),
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
        
        SELECT * INTO user_record FROM auth.users WHERE email = p_email;
    ELSE
        -- Update existing user metadata
        UPDATE auth.users 
        SET 
            raw_user_meta_data = jsonb_build_object('subscription_tier', session_record.subscription_tier),
            last_sign_in_at = now(),
            updated_at = now()
        WHERE email = p_email;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true, 
        'user_id', user_record.id,
        'email', user_record.email,
        'subscription_tier', session_record.subscription_tier
    );
END;
$function$;
-- Create a secure function to create authenticated sessions for premium users
CREATE OR REPLACE FUNCTION public.create_premium_user_session(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_record record;
    result jsonb;
BEGIN
    -- Check if user exists in beehiiv_subscribers with premium tier
    SELECT * INTO user_record 
    FROM public.beehiiv_subscribers 
    WHERE email = p_email 
    AND subscription_tier = 'premium';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found or not premium');
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
            crypt('premium_user_' || gen_random_uuid()::text, gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "premium_restoration", "providers": ["premium_restoration"]}',
            jsonb_build_object('subscription_tier', 'premium'),
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
        
        SELECT * INTO user_record FROM auth.users WHERE email = p_email;
    ELSE
        -- Update existing user metadata and timestamps
        UPDATE auth.users 
        SET 
            raw_user_meta_data = jsonb_build_object('subscription_tier', 'premium'),
            last_sign_in_at = now(),
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE email = p_email;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true, 
        'user_id', user_record.id,
        'email', user_record.email,
        'subscription_tier', 'premium'
    );
END;
$$;
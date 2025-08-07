-- Function to manually fix a user's subscription tier
CREATE OR REPLACE FUNCTION public.force_refresh_user_tier(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb;
    subscriber_record record;
    session_count integer := 0;
    auth_user_id uuid;
BEGIN
    -- Only admins can use this function
    IF NOT is_current_user_admin_fast() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
    END IF;
    
    -- Get the subscriber record
    SELECT * INTO subscriber_record
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found in subscribers');
    END IF;
    
    -- Get auth user ID
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = user_email;
    
    -- Update any existing user sessions with correct tier
    IF auth_user_id IS NOT NULL THEN
        UPDATE public.user_sessions
        SET tier = subscriber_record.subscription_tier,
            updated_at = now()
        WHERE user_id = auth_user_id;
        
        GET DIAGNOSTICS session_count = ROW_COUNT;
    END IF;
    
    -- Force refresh the beehiiv subscriber record metadata
    UPDATE public.beehiiv_subscribers
    SET 
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'manual_refresh_at', now(),
            'refreshed_by', get_current_user_email_optimized()
        ),
        updated_at = now()
    WHERE email = user_email;
    
    result := jsonb_build_object(
        'success', true,
        'user_email', user_email,
        'subscription_tier', subscriber_record.subscription_tier,
        'sessions_updated', session_count,
        'auth_user_exists', auth_user_id IS NOT NULL,
        'refreshed_at', now()
    );
    
    RETURN result;
END;
$$;
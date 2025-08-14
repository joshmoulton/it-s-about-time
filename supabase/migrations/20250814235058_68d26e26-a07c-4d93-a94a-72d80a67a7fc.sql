-- Create a debug function to check current auth state
CREATE OR REPLACE FUNCTION public.debug_current_auth_session()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{}';
    auth_uid uuid;
    auth_email text;
    beehiiv_data record;
BEGIN
    -- Get auth.uid()
    auth_uid := auth.uid();
    result := result || jsonb_build_object('auth_uid', auth_uid);
    
    -- Get auth.email() 
    BEGIN
        auth_email := auth.email();
        result := result || jsonb_build_object('auth_email', auth_email);
    EXCEPTION WHEN OTHERS THEN
        result := result || jsonb_build_object('auth_email_error', SQLERRM);
    END;
    
    -- Get current email using our function
    result := result || jsonb_build_object('current_email', get_current_user_email_optimized());
    
    -- Get current tier using our function
    result := result || jsonb_build_object('current_tier', get_current_user_tier_optimized());
    
    -- Check beehiiv subscriber data
    IF auth_email IS NOT NULL THEN
        SELECT email, subscription_tier, status INTO beehiiv_data
        FROM beehiiv_subscribers 
        WHERE email = auth_email;
        
        result := result || jsonb_build_object(
            'beehiiv_subscriber', 
            CASE 
                WHEN beehiiv_data.email IS NOT NULL 
                THEN jsonb_build_object(
                    'email', beehiiv_data.email,
                    'tier', beehiiv_data.subscription_tier,
                    'status', beehiiv_data.status
                )
                ELSE null
            END
        );
    END IF;
    
    -- Check admin status
    result := result || jsonb_build_object('is_admin', is_current_user_admin_fast());
    
    RETURN result;
END;
$$;
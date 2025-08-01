-- Create a function to check admin status with 2FA session
CREATE OR REPLACE FUNCTION public.check_admin_with_2fa_session(p_session_token text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
    has_2fa_enabled BOOLEAN := FALSE;
    has_verified_session BOOLEAN := FALSE;
BEGIN
    -- Get auth.uid() first for Supabase authenticated users
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user (local admin), prioritize this
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth_uid;
        IF user_email IS NOT NULL THEN
            -- Check if user is in admin_users table
            IF NOT EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            ) THEN
                RETURN FALSE;
            END IF;
            
            -- Check if admin has 2FA enabled
            SELECT EXISTS (
                SELECT 1 FROM public.admin_2fa_secrets 
                WHERE admin_email = user_email AND is_enabled = true
            ) INTO has_2fa_enabled;
            
            -- If 2FA is not enabled, deny access (make 2FA mandatory)
            IF NOT has_2fa_enabled THEN
                RETURN FALSE;
            END IF;
            
            -- Check for valid 2FA session if token provided
            IF p_session_token IS NOT NULL THEN
                SELECT EXISTS (
                    SELECT 1 FROM public.admin_2fa_sessions
                    WHERE session_token = p_session_token
                    AND admin_email = user_email
                    AND expires_at > now()
                    AND verified_at IS NOT NULL
                ) INTO has_verified_session;
                
                -- Return true only if 2FA is enabled AND session is verified
                RETURN has_verified_session;
            END IF;
            
            -- No session token provided
            RETURN FALSE;
        END IF;
    END IF;
    
    -- No admin access for other authentication methods when 2FA is mandatory
    RETURN FALSE;
END;
$$;
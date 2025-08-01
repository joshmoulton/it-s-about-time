-- Allow initial admin access for Supabase users without 2FA requirement for first-time setup
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
    has_2fa_enabled BOOLEAN := FALSE;
    has_verified_session BOOLEAN := FALSE;
    session_token TEXT;
    is_dev_environment BOOLEAN := TRUE; -- Set to true for development
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
            
            -- In development, allow admin access for Supabase users without 2FA requirement
            -- This allows initial setup and 2FA configuration
            IF is_dev_environment THEN
                RETURN TRUE;
            END IF;
            
            -- In production, check if admin has 2FA enabled
            SELECT EXISTS (
                SELECT 1 FROM public.admin_2fa_secrets 
                WHERE admin_email = user_email AND is_enabled = true
            ) INTO has_2fa_enabled;
            
            -- If 2FA is not enabled in production, deny access
            IF NOT has_2fa_enabled THEN
                RETURN FALSE;
            END IF;
            
            -- Check for valid 2FA session
            BEGIN
                session_token := current_setting('app.admin_2fa_session', true);
                IF session_token IS NOT NULL AND session_token != '' THEN
                    SELECT EXISTS (
                        SELECT 1 FROM public.admin_2fa_sessions
                        WHERE session_token = session_token
                        AND admin_email = user_email
                        AND expires_at > now()
                        AND verified_at IS NOT NULL
                    ) INTO has_verified_session;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                has_verified_session := FALSE;
            END;
            
            -- Return true only if 2FA is enabled AND session is verified
            RETURN has_verified_session;
        END IF;
    END IF;
    
    -- For non-Supabase auth users, deny admin access for security
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF user_email IS NOT NULL AND user_email != '' THEN
            -- For Whop users, deny admin access for security
            RETURN FALSE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Check session-based authentication (legacy support)
    BEGIN
        user_email := current_setting('app.current_user_email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            -- Check if user is in admin_users table
            IF NOT EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            ) THEN
                RETURN FALSE;
            END IF;
            
            -- Apply same development vs production logic
            IF is_dev_environment THEN
                RETURN TRUE;
            END IF;
            
            -- In production, check 2FA requirements
            SELECT EXISTS (
                SELECT 1 FROM public.admin_2fa_secrets 
                WHERE admin_email = user_email AND is_enabled = true
            ) INTO has_2fa_enabled;
            
            IF NOT has_2fa_enabled THEN
                RETURN FALSE;
            END IF;
            
            -- Check for valid 2FA session
            BEGIN
                session_token := current_setting('app.admin_2fa_session', true);
                IF session_token IS NOT NULL AND session_token != '' THEN
                    SELECT EXISTS (
                        SELECT 1 FROM public.admin_2fa_sessions
                        WHERE session_token = session_token
                        AND admin_email = user_email
                        AND expires_at > now()
                        AND verified_at IS NOT NULL
                    ) INTO has_verified_session;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                has_verified_session := FALSE;
            END;
            
            RETURN has_verified_session;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- No admin access granted
    RETURN FALSE;
END;
$$;
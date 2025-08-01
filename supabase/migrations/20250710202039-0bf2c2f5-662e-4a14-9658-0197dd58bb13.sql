-- Create a function to merge/sync admin status for Whop users
CREATE OR REPLACE FUNCTION public.sync_whop_admin_status(p_email text, p_role text DEFAULT 'admin')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    whop_user_exists BOOLEAN := false;
    admin_record_exists BOOLEAN := false;
    result jsonb;
BEGIN
    -- Check if the email exists in whop_authenticated_users
    SELECT EXISTS (
        SELECT 1 FROM public.whop_authenticated_users 
        WHERE user_email = p_email
    ) INTO whop_user_exists;
    
    -- Check if admin record already exists
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = p_email
    ) INTO admin_record_exists;
    
    -- If Whop user exists but no admin record, create one
    IF whop_user_exists AND NOT admin_record_exists THEN
        INSERT INTO public.admin_users (
            email,
            role,
            user_type,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            p_email,
            p_role,
            'whop_admin',
            true,
            now(),
            now()
        );
        
        result := jsonb_build_object(
            'success', true,
            'action', 'created',
            'message', 'Admin record created for Whop user',
            'email', p_email,
            'role', p_role
        );
    ELSIF whop_user_exists AND admin_record_exists THEN
        -- Update existing admin record to ensure it's active
        UPDATE public.admin_users 
        SET 
            is_active = true,
            role = p_role,
            user_type = 'whop_admin',
            updated_at = now()
        WHERE email = p_email;
        
        result := jsonb_build_object(
            'success', true,
            'action', 'updated',
            'message', 'Admin record updated for Whop user',
            'email', p_email,
            'role', p_role
        );
    ELSIF NOT whop_user_exists THEN
        result := jsonb_build_object(
            'success', false,
            'action', 'none',
            'message', 'No Whop user found with this email',
            'email', p_email
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'action', 'none',
            'message', 'Admin record already exists and is current',
            'email', p_email
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- Create a function to debug current user authentication status
CREATE OR REPLACE FUNCTION public.debug_user_auth_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb := '{}';
    auth_uid uuid;
    jwt_email text;
    supabase_email text;
    current_email text;
    is_admin boolean;
    whop_user_exists boolean;
    admin_record_exists boolean;
BEGIN
    -- Get auth.uid()
    auth_uid := auth.uid();
    result := result || jsonb_build_object('auth_uid', auth_uid);
    
    -- Get email from Supabase auth
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO supabase_email FROM auth.users WHERE id = auth_uid;
        result := result || jsonb_build_object('supabase_email', supabase_email);
    END IF;
    
    -- Get email from JWT claims
    BEGIN
        jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
        result := result || jsonb_build_object('jwt_email', jwt_email);
    EXCEPTION WHEN OTHERS THEN
        result := result || jsonb_build_object('jwt_email_error', SQLERRM);
    END;
    
    -- Get current email using our function
    current_email := get_current_user_email();
    result := result || jsonb_build_object('current_email', current_email);
    
    -- Check admin status
    is_admin := is_current_user_admin();
    result := result || jsonb_build_object('is_admin', is_admin);
    
    -- Check if Whop user exists
    IF current_email IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.whop_authenticated_users 
            WHERE user_email = current_email
        ) INTO whop_user_exists;
        result := result || jsonb_build_object('whop_user_exists', whop_user_exists);
        
        -- Check if admin record exists
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE email = current_email
        ) INTO admin_record_exists;
        result := result || jsonb_build_object('admin_record_exists', admin_record_exists);
    END IF;
    
    RETURN result;
END;
$function$;
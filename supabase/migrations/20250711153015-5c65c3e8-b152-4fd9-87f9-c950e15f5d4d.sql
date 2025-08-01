-- More thorough fix for the remaining 3 functions with search path issues

-- Completely drop all versions of log_data_access function
DROP FUNCTION IF EXISTS public.log_data_access(uuid, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.log_data_access(text, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.log_data_access(text, text, text);
DROP FUNCTION IF EXISTS public.log_data_access(text, text, text, text);

-- Recreate log_data_access with proper search path
CREATE OR REPLACE FUNCTION public.log_data_access(admin_email text, action_type text, resource_type text, resource_id text DEFAULT NULL, access_granted boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.data_access_logs (
        admin_email, action_type, resource_type, resource_id, access_granted
    ) VALUES (
        log_data_access.admin_email, 
        log_data_access.action_type, 
        log_data_access.resource_type, 
        log_data_access.resource_id, 
        log_data_access.access_granted
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

-- Completely drop all versions of is_ip_allowed function
DROP FUNCTION IF EXISTS public.is_ip_allowed(inet, text);
DROP FUNCTION IF EXISTS public.is_ip_allowed(text, text);
DROP FUNCTION IF EXISTS public.is_ip_allowed(inet, text, text);

-- Recreate is_ip_allowed with proper search path
CREATE OR REPLACE FUNCTION public.is_ip_allowed(ip_address inet, admin_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_ip_allowlist
        WHERE admin_ip_allowlist.admin_email = is_ip_allowed.admin_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND is_ip_allowed.ip_address << admin_ip_allowlist.ip_address
    );
END;
$function$;

-- Completely drop all versions of require_secure_data_access function
DROP FUNCTION IF EXISTS public.require_secure_data_access(text, text);
DROP FUNCTION IF EXISTS public.require_secure_data_access(text);

-- Recreate require_secure_data_access with proper search path
CREATE OR REPLACE FUNCTION public.require_secure_data_access(p_operation_type text, p_resource_id text DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    admin_email TEXT;
    has_access BOOLEAN := false;
BEGIN
    admin_email := get_current_user_email();
    
    IF admin_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is authorized admin
    IF NOT is_current_user_admin() THEN
        RETURN false;
    END IF;
    
    -- Check data access quota
    IF NOT check_data_access_quota(admin_email, p_operation_type) THEN
        RETURN false;
    END IF;
    
    -- Log the access attempt
    PERFORM log_data_access(admin_email, p_operation_type, p_operation_type, p_resource_id, true);
    
    RETURN true;
END;
$function$;
-- Fix the audit function to handle null user_email properly
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    operation_details jsonb;
BEGIN
    user_email := COALESCE(get_current_user_email(), 'system');
    
    -- Build operation details
    operation_details := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW(),
        'user_email', user_email
    );
    
    -- Add old/new values for updates
    IF TG_OP = 'UPDATE' THEN
        operation_details := operation_details || jsonb_build_object(
            'old_values', to_jsonb(OLD),
            'new_values', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        operation_details := operation_details || jsonb_build_object(
            'new_values', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        operation_details := operation_details || jsonb_build_object(
            'deleted_values', to_jsonb(OLD)
        );
    END IF;
    
    -- Insert audit record with proper email handling
    INSERT INTO admin_audit_log (
        action,
        resource,
        resource_id,
        user_email,
        metadata
    ) VALUES (
        LOWER(TG_OP),
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
            ELSE NEW.id::TEXT
        END,
        user_email,
        operation_details
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Now fix your user type
UPDATE public.admin_users 
SET user_type = 'supabase_admin' 
WHERE email = 'moulton.joshua@gmail.com' AND user_type = 'whop_admin';
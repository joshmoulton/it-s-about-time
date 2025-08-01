-- Enhanced RLS policies with fine-grained access control

-- Create enhanced admin session tracking function
CREATE OR REPLACE FUNCTION public.get_admin_session_info()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    admin_record RECORD;
    session_info jsonb := '{}';
BEGIN
    -- Get current user email
    user_email := get_current_user_email();
    
    IF user_email IS NULL THEN
        RETURN '{"is_admin": false}'::jsonb;
    END IF;
    
    -- Get admin details
    SELECT * INTO admin_record
    FROM admin_users
    WHERE email = user_email AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN '{"is_admin": false}'::jsonb;
    END IF;
    
    -- Build session info
    session_info := jsonb_build_object(
        'is_admin', true,
        'role', admin_record.role,
        'user_type', admin_record.user_type,
        'last_login', admin_record.last_login_at,
        'created_at', admin_record.created_at
    );
    
    RETURN session_info;
END;
$$;

-- Create time-based access control function
CREATE OR REPLACE FUNCTION public.is_business_hours()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    current_hour INTEGER;
    current_dow INTEGER; -- day of week (0 = Sunday)
BEGIN
    current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC');
    current_dow := EXTRACT(DOW FROM NOW() AT TIME ZONE 'UTC');
    
    -- Business hours: Monday-Friday (1-5), 9AM-5PM UTC
    RETURN (current_dow BETWEEN 1 AND 5) AND (current_hour BETWEEN 9 AND 17);
END;
$$;

-- Create enhanced user role check function
CREATE OR REPLACE FUNCTION public.has_admin_role(required_role TEXT)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    user_email := get_current_user_email();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role
    FROM admin_users
    WHERE email = user_email AND is_active = true;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Define role hierarchy
    role_hierarchy := CASE user_role
        WHEN 'super_admin' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'editor' THEN 2
        WHEN 'moderator' THEN 1
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'super_admin' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'editor' THEN 2
        WHEN 'moderator' THEN 1
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$;

-- Enhanced RLS policies for sensitive tables

-- Admin users table - restrict access and operations
DROP POLICY IF EXISTS "Authenticated users can access admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can modify admin data" ON public.admin_users;

CREATE POLICY "Super admins can view all admin users"
ON public.admin_users
FOR SELECT
USING (has_admin_role('super_admin'));

CREATE POLICY "Admins can view active admin users"
ON public.admin_users
FOR SELECT
USING (has_admin_role('admin') AND is_active = true);

CREATE POLICY "Super admins can create admin users during business hours"
ON public.admin_users
FOR INSERT
WITH CHECK (
    has_admin_role('super_admin') AND 
    is_business_hours()
);

CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

CREATE POLICY "Only super admins can delete admin users during business hours"
ON public.admin_users
FOR DELETE
USING (
    has_admin_role('super_admin') AND 
    is_business_hours()
);

-- BeehiIV subscribers - enhanced protection
CREATE POLICY "Admins can view subscribers with restrictions"
ON public.beehiiv_subscribers
FOR SELECT
USING (has_admin_role('admin'));

CREATE POLICY "Only super admins can modify subscribers"
ON public.beehiiv_subscribers
FOR UPDATE
USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

CREATE POLICY "Prevent subscriber deletion except during business hours"
ON public.beehiiv_subscribers
FOR DELETE
USING (
    has_admin_role('super_admin') AND 
    is_business_hours()
);

-- Admin audit log - read-only for most users
CREATE POLICY "Admins can view recent audit logs"
ON public.admin_audit_log
FOR SELECT
USING (
    has_admin_role('admin') AND 
    created_at > NOW() - INTERVAL '30 days'
);

CREATE POLICY "Super admins can view all audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_admin_role('super_admin'));

-- Telegram messages - restrict admin access
CREATE POLICY "Editors can view telegram messages"
ON public.telegram_messages
FOR SELECT
USING (has_admin_role('editor'));

CREATE POLICY "Admins can hide inappropriate messages"
ON public.telegram_messages
FOR UPDATE
USING (has_admin_role('admin'))
WITH CHECK (has_admin_role('admin'));

-- System settings - super admin only
CREATE POLICY "Only super admins can modify critical system settings"
ON public.system_settings
FOR ALL
USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

-- Create audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    operation_details jsonb;
BEGIN
    user_email := get_current_user_email();
    
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
    
    -- Insert audit record
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

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_admin_users ON admin_users;
CREATE TRIGGER audit_admin_users
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_beehiiv_subscribers ON beehiiv_subscribers;
CREATE TRIGGER audit_beehiiv_subscribers
    AFTER INSERT OR UPDATE OR DELETE ON beehiiv_subscribers
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_system_settings ON system_settings;
CREATE TRIGGER audit_system_settings
    AFTER INSERT OR UPDATE OR DELETE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();
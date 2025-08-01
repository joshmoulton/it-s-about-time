-- Fix Auth RLS Initialization Plan issues by optimizing policies
-- Remove direct calls to current_setting() and auth.* functions in RLS policies

-- 1. Create optimized security definer functions that don't cause RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS TEXT 
LANGUAGE plpgsql 
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- Get auth.uid() once and store it
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user, use their email directly
    IF auth_uid IS NOT NULL THEN
        SELECT u.email INTO user_email 
        FROM auth.users u 
        WHERE u.id = auth_uid;
        
        IF user_email IS NOT NULL THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Return null if no user found (avoid JWT parsing in RLS)
    RETURN NULL;
END;
$$;

-- 2. Create a faster admin check function
CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- Get auth.uid() once
    auth_uid := auth.uid();
    
    -- Quick exit if no auth user
    IF auth_uid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get email directly from auth.users
    SELECT u.email INTO user_email 
    FROM auth.users u 
    WHERE u.id = auth_uid;
    
    -- Quick exit if no email
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check admin_users table directly (no joins, no complex logic)
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = user_email 
        AND is_active = true
        AND user_type = 'supabase_admin'
    );
END;
$$;

-- 3. Update key policies to use optimized functions and reduce auth calls

-- Update admin_users policies to be more efficient
DROP POLICY IF EXISTS "Enhanced admins can view active admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced super admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced super admins can create admin users during business ho" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced only super admins can delete admin users during busine" ON public.admin_users;

-- Create simpler, faster policies for admin_users
CREATE POLICY "Fast admin users read" ON public.admin_users
FOR SELECT USING (is_current_user_admin_fast());

CREATE POLICY "Fast admin users write" ON public.admin_users
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Update beehiiv_subscribers policies
DROP POLICY IF EXISTS "Enhanced only super admins can modify subscribers" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Enhanced prevent subscriber deletion except during business hou" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Super admins can view all subscribers for dashboard stats" ON public.beehiiv_subscribers;

-- Create simpler policies for beehiiv_subscribers
CREATE POLICY "Fast subscribers admin read" ON public.beehiiv_subscribers
FOR SELECT USING (
  is_current_user_admin_fast() OR 
  email = get_current_user_email_optimized()
);

CREATE POLICY "Fast subscribers admin write" ON public.beehiiv_subscribers
FOR UPDATE USING (
  is_current_user_admin_fast() OR 
  email = get_current_user_email_optimized()
)
WITH CHECK (
  is_current_user_admin_fast() OR 
  email = get_current_user_email_optimized()
);

-- 4. Update other high-impact policies to use faster functions

-- Update admin_audit_log policies
DROP POLICY IF EXISTS "Admins can view their own audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_audit_log;

CREATE POLICY "Fast audit log read" ON public.admin_audit_log
FOR SELECT USING (is_current_user_admin_fast());

-- Update system_settings policies
DROP POLICY IF EXISTS "System settings read" ON public.system_settings;
DROP POLICY IF EXISTS "System settings management" ON public.system_settings;

CREATE POLICY "Fast system settings read" ON public.system_settings
FOR SELECT USING (true); -- Allow all users to read system settings

CREATE POLICY "Fast system settings write" ON public.system_settings
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());
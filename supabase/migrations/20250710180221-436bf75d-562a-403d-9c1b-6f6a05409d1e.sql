-- Fix the is_current_user_admin function to work with both Whop and email auth
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simply check if the user's email exists in admin_users table and is active
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    AND is_active = true
  );
END;
$$;
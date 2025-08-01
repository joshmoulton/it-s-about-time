-- Restore admin access and fix admin functionality

-- First, let's add your email back to admin_users table
INSERT INTO public.admin_users (email, role, is_active, user_type)
VALUES ('moulton.joshua@gmail.com', 'super_admin', true, 'supabase_admin')
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  user_type = 'supabase_admin',
  updated_at = now();

-- Add kil as admin too
INSERT INTO public.admin_users (email, role, is_active, user_type)
VALUES ('kil@weekwiz.com', 'super_admin', true, 'supabase_admin')
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  user_type = 'supabase_admin',
  updated_at = now();

-- Fix the is_current_user_admin function to work properly with both types
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.is_active = TRUE
    AND (
      -- Check via direct email (for Supabase admins)
      (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
      OR
      -- Check via beehiiv subscriber (for subscriber-linked admins)
      (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      ))
    )
  );
END;
$$;

-- Clean up any duplicate or broken admin records
DELETE FROM public.admin_users 
WHERE email IS NULL AND subscriber_id IS NULL;

-- Update any admin records that have both email and subscriber_id to prefer email
UPDATE public.admin_users 
SET subscriber_id = NULL 
WHERE email IS NOT NULL AND subscriber_id IS NOT NULL;
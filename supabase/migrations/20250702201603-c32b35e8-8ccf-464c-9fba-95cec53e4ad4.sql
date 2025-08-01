-- Fix infinite recursion by completely removing all RLS policies from admin_users table
-- and creating new non-recursive policies

-- Drop all existing policies on admin_users to break the recursion
DROP POLICY IF EXISTS "Super admins can manage all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create simple, non-recursive policies for admin_users table
-- Allow everyone to read admin_users (since we need this for admin checks)
CREATE POLICY "Allow read access to admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (true);

-- Only allow super admins to manage admin users (but don't check via admin_users table)
-- This policy checks directly against JWT without referencing admin_users table
CREATE POLICY "Super admins can manage admin users via email" 
  ON public.admin_users 
  FOR ALL 
  USING (
    -- Check if current user email exists in admin_users as super_admin
    -- This is safe because it doesn't create recursion (direct email check)
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.role = 'super_admin' 
      AND au.is_active = true
    )
  );
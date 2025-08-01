
-- Fix infinite recursion in admin_users RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Create new RLS policies that don't cause recursion
-- Allow users to view admin records where they are the admin (direct check without function)
CREATE POLICY "Users can view their own admin record" 
  ON public.admin_users 
  FOR SELECT 
  USING (
    -- Direct check via subscriber
    (subscriber_id IS NOT NULL AND subscriber_id = (
      SELECT id FROM public.beehiiv_subscribers 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ))
    OR
    -- Direct check via email
    (email IS NOT NULL AND email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- Allow super admins to manage all admin users (direct check without function)
CREATE POLICY "Super admins can manage all admin users" 
  ON public.admin_users 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.is_active = true 
      AND au.role = 'super_admin'
      AND (
        -- Direct check via subscriber
        (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
          SELECT id FROM public.beehiiv_subscribers 
          WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        ))
        OR
        -- Direct check via email
        (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
      )
    )
  );


-- Make subscriber_id nullable and add direct email field to admin_users table
ALTER TABLE public.admin_users 
ALTER COLUMN subscriber_id DROP NOT NULL;

-- Add email field for standalone admin accounts
ALTER TABLE public.admin_users 
ADD COLUMN email TEXT;

-- Add user_type to distinguish between different admin account types
ALTER TABLE public.admin_users 
ADD COLUMN user_type TEXT DEFAULT 'supabase_admin';

-- Create index on email for better performance
CREATE INDEX idx_admin_users_email ON public.admin_users(email);

-- Update RLS policies to work with both subscriber-linked and standalone admins
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Create new RLS policies that work with standalone admins
CREATE POLICY "Admins can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (
    -- Allow if current user is an admin (either via subscriber or direct)
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.is_active = true 
      AND (
        -- Check via beehiiv subscriber
        (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
          SELECT id FROM public.beehiiv_subscribers 
          WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        ))
        OR
        -- Check via direct email
        (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
      )
    )
  );

CREATE POLICY "Super admins can manage admin users" 
  ON public.admin_users 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.is_active = true 
      AND au.role = 'super_admin'
      AND (
        -- Check via beehiiv subscriber
        (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
          SELECT id FROM public.beehiiv_subscribers 
          WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        ))
        OR
        -- Check via direct email
        (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
      )
    )
  );

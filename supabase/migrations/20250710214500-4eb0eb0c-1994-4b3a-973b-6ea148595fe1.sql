-- Fix feedback_replies RLS policies to work with Enhanced Auth
DROP POLICY IF EXISTS "Admins can create replies" ON feedback_replies;

-- Create a more flexible policy that works with both auth systems
CREATE POLICY "Authenticated users can create replies" 
ON feedback_replies 
FOR INSERT 
TO authenticated
WITH CHECK (
  admin_email IS NOT NULL 
  AND admin_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (
    -- Enhanced Auth users (check if they're admin)
    (current_setting('request.jwt.claims', true) IS NULL 
     OR current_setting('request.jwt.claims', true) = ''
     OR current_setting('request.jwt.claims', true) = '{}') 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = admin_email AND is_active = true
    )
    -- OR traditional Supabase Auth admin check
    OR is_current_user_admin()
  )
);
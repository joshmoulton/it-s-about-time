-- Fix feedback RLS policies to work with Enhanced Auth system
DROP POLICY IF EXISTS "Users can create their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;

-- Create new flexible RLS policies that work with both Enhanced Auth and Supabase Auth
CREATE POLICY "Users can create feedback" 
ON feedback 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_email IS NOT NULL 
  AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (
    -- Enhanced Auth users (no JWT claims available)
    current_setting('request.jwt.claims', true) IS NULL
    OR current_setting('request.jwt.claims', true) = ''
    OR current_setting('request.jwt.claims', true) = '{}'
    -- Supabase Auth users (JWT claims available)
    OR user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
  )
);

CREATE POLICY "Users can view feedback" 
ON feedback 
FOR SELECT 
TO authenticated
USING (
  -- Admins can view all feedback
  is_current_user_admin() 
  -- Users can view their own feedback if they have JWT claims
  OR (
    current_setting('request.jwt.claims', true) IS NOT NULL
    AND current_setting('request.jwt.claims', true) != ''
    AND current_setting('request.jwt.claims', true) != '{}'
    AND user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
  )
);
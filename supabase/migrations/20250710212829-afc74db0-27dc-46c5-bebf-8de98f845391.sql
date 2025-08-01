-- Fix feedback RLS policies to allow anonymous users (Enhanced Auth) to submit feedback

-- Drop ALL existing feedback policies first
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Anonymous users can create feedback with valid email" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback via JWT" ON feedback;

-- Create new policy for anonymous users to submit feedback
-- This allows Enhanced Auth users (who appear as 'anon' to Supabase) to submit feedback
CREATE POLICY "Anonymous users can create feedback with valid email" 
ON feedback 
FOR INSERT 
TO anon
WITH CHECK (
  user_email IS NOT NULL 
  AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND char_length(user_email) <= 254
  AND char_length(title) <= 200
  AND char_length(description) <= 2000
);

-- Create policy for authenticated Supabase users to submit feedback
CREATE POLICY "Authenticated users can create feedback" 
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

-- Create viewing policies for feedback
CREATE POLICY "Admins can view all feedback" 
ON feedback 
FOR SELECT 
TO authenticated
USING (is_current_user_admin());

CREATE POLICY "Users can view their own feedback via JWT" 
ON feedback 
FOR SELECT 
TO authenticated
USING (
  current_setting('request.jwt.claims', true) IS NOT NULL
  AND current_setting('request.jwt.claims', true) != ''
  AND current_setting('request.jwt.claims', true) != '{}'
  AND user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
);

-- Update policy for admins to update feedback
CREATE POLICY "Admins can update all feedback" 
ON feedback 
FOR UPDATE 
TO authenticated
USING (is_current_user_admin());
-- Fix RLS policies for beehiiv_subscribers to work with authenticated users
DROP POLICY IF EXISTS "Users can update their own subscriber data" ON beehiiv_subscribers;

CREATE POLICY "Users can update their own subscriber data" 
ON beehiiv_subscribers 
FOR UPDATE 
TO authenticated
USING (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'))
WITH CHECK (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

-- Fix RLS policies for feedback to work with authenticated users  
DROP POLICY IF EXISTS "Users can create their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;

CREATE POLICY "Users can create their own feedback" 
ON feedback 
FOR INSERT 
TO authenticated
WITH CHECK (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

CREATE POLICY "Users can view their own feedback" 
ON feedback 
FOR SELECT 
TO authenticated
USING (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

CREATE POLICY "Admins can view all feedback" 
ON feedback 
FOR SELECT 
TO authenticated
USING (is_current_user_admin());

CREATE POLICY "Admins can update all feedback" 
ON feedback 
FOR UPDATE 
TO authenticated
USING (is_current_user_admin());
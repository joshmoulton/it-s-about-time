-- Fix feedback RLS policies to work with current authentication
DROP POLICY IF EXISTS "Users can create their own feedback" ON feedback;

CREATE POLICY "Users can create their own feedback" 
ON feedback 
FOR INSERT 
TO authenticated
WITH CHECK (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;

CREATE POLICY "Users can view their own feedback" 
ON feedback 
FOR SELECT 
TO authenticated
USING (user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));
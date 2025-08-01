-- Check current policies on user_trading_profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_trading_profiles';

-- Drop existing restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Users can insert their own trading profiles" ON user_trading_profiles;
DROP POLICY IF EXISTS "Users can update their own trading profiles" ON user_trading_profiles;
DROP POLICY IF EXISTS "Users can view their own trading profiles" ON user_trading_profiles;
DROP POLICY IF EXISTS "Users can delete their own trading profiles" ON user_trading_profiles;
DROP POLICY IF EXISTS "Users can manage their own trading profile" ON user_trading_profiles;
DROP POLICY IF EXISTS "Admins can view all trading profiles" ON user_trading_profiles;

-- Create simplified policies that work with Whop auth
CREATE POLICY "Allow authenticated users to manage trading profiles" ON user_trading_profiles
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'email' IS NOT NULL
) WITH CHECK (
  user_email = current_setting('request.jwt.claims', true)::json->>'email'
);
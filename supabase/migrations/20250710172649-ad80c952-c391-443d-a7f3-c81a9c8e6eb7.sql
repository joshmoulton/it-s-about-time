-- Check what policies currently exist
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_trading_profiles';

-- Temporarily disable RLS to test
ALTER TABLE user_trading_profiles DISABLE ROW LEVEL SECURITY;

-- Then re-enable with a very simple policy
ALTER TABLE user_trading_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all policies first
DROP POLICY IF EXISTS "Allow authenticated users to manage trading profiles" ON user_trading_profiles;

-- Create the most permissive policy possible for now
CREATE POLICY "Allow all operations on trading profiles" ON user_trading_profiles
FOR ALL USING (true) WITH CHECK (true);
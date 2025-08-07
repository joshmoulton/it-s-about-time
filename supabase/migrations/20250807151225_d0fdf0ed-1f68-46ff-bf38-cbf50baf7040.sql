-- Fix RLS policies for user_profiles table to ensure proper access for all user types

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create updated policies with better logic
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (
  (auth.uid() = user_id) OR 
  (user_email = get_current_user_email_optimized()) OR 
  (whop_email = get_current_user_email_optimized()) OR
  is_current_user_admin_fast()
);

CREATE POLICY "Users can create their own profile" ON user_profiles
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_email = get_current_user_email_optimized()) OR 
  (whop_email = get_current_user_email_optimized()) OR
  is_current_user_admin_fast()
);

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (
  (auth.uid() = user_id) OR 
  (user_email = get_current_user_email_optimized()) OR 
  (whop_email = get_current_user_email_optimized()) OR
  is_current_user_admin_fast()
) WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_email = get_current_user_email_optimized()) OR 
  (whop_email = get_current_user_email_optimized()) OR
  is_current_user_admin_fast()
);
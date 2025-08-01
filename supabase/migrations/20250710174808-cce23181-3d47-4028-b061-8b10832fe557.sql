-- Fix RLS policies for user_profiles table
-- The current policies are not working correctly for Supabase admin users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create simplified, working policies
CREATE POLICY "Users can manage their own profile" 
ON public.user_profiles 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
)
WITH CHECK (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

-- Ensure moulton.joshua@gmail.com has admin access restored
INSERT INTO public.admin_users (email, role, is_active, user_type)
VALUES ('moulton.joshua@gmail.com', 'admin', true, 'supabase_admin')
ON CONFLICT (email) 
DO UPDATE SET 
  is_active = true,
  role = 'admin',
  user_type = 'supabase_admin',
  updated_at = now();
-- Fix user_profiles constraint issue
-- Remove the problematic check constraint that's causing 400 errors
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_reference_check;

-- Add a more flexible check constraint that allows null values or proper references
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_reference_check 
CHECK (
  user_id IS NOT NULL OR 
  user_email IS NOT NULL OR 
  whop_email IS NOT NULL
);

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
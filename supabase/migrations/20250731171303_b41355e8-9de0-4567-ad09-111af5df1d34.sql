-- Add tour_disabled field to existing user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS tour_disabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Add user_email field if it doesn't exist to link to our auth system
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create index for email lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_email ON public.user_profiles(user_email);
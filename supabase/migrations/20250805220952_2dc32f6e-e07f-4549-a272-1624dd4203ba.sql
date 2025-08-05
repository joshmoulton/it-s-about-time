-- Fix tour preferences table structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  tour_disabled BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can manage their own profile"
ON public.user_profiles 
FOR ALL
USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

-- Add unique constraint for proper upsert functionality
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON public.user_profiles(user_email);

-- Fix the newsletter query by ensuring RLS policies use fully qualified column names
DROP POLICY IF EXISTS "Users can view newsletters based on tier" ON public.newsletters;

CREATE POLICY "Users can view newsletters based on tier"
ON public.newsletters
FOR SELECT
USING (
  newsletters.status = 'published' AND (
    newsletters.required_tier = 'free' OR
    (newsletters.required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (newsletters.required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
    is_current_user_admin_fast()
  )
);
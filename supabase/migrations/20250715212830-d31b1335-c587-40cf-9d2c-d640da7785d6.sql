-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  whop_email TEXT, -- For linking to whop_authenticated_users
  display_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  linkedin_profile TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure either user_id or whop_email is set, but not both
  CONSTRAINT user_profiles_user_reference_check CHECK (
    (user_id IS NOT NULL AND whop_email IS NULL) OR 
    (user_id IS NULL AND whop_email IS NOT NULL)
  ),
  
  -- Ensure unique profiles per user
  UNIQUE(user_id),
  UNIQUE(whop_email)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

-- Create updated_at trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create user_profiles table to support user profile data
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  whop_email TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  linkedin_profile TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  tour_disabled BOOLEAN NOT NULL DEFAULT false,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(user_email),
  UNIQUE(whop_email)
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user profile access
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  user_email = get_current_user_email_optimized() OR
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  user_email = get_current_user_email_optimized() OR
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  user_email = get_current_user_email_optimized() OR
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "Admins can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
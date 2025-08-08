-- Fix user_profiles table constraints and RLS policies

-- Add unique constraint on user_email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_user_email_key'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_email_key UNIQUE (user_email);
    END IF;
END $$;

-- Drop existing RLS policies for user_profiles to recreate them properly
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Users can manage their own profiles by any identifier" 
ON public.user_profiles 
FOR ALL 
USING (
  (user_id = auth.uid()) OR 
  (user_email = get_current_user_email_optimized()) OR 
  (whop_email = get_current_user_email_optimized()) OR
  is_current_user_admin_fast()
)
WITH CHECK (
  (user_id = auth.uid()) OR 
  (user_email = get_current_user_email_optimized()) OR 
  (whop_email = get_current_user_email_optimized()) OR
  is_current_user_admin_fast()
);

-- Ensure user_profiles has proper RLS enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current subscriber tier for RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_tier_optimized()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    user_tier subscription_tier;
    is_admin BOOLEAN;
BEGIN
    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN 'free'::subscription_tier;
    END IF;
    
    -- Check if user is admin first
    is_admin := is_current_user_admin_fast();
    IF is_admin THEN
        RETURN 'premium'::subscription_tier;
    END IF;
    
    -- Check beehiiv_subscribers table for tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    -- Return found tier or default to free
    RETURN COALESCE(user_tier, 'free'::subscription_tier);
END;
$$;

-- Update chat_highlights policy to use the optimized function
DROP POLICY IF EXISTS "Chat highlights premium access" ON public.chat_highlights;
CREATE POLICY "Chat highlights premium access" 
ON public.chat_highlights 
FOR SELECT 
USING (
  (get_current_user_tier_optimized() = 'premium'::subscription_tier) OR 
  is_current_user_admin_fast()
);

-- Update auto_highlights policy to use the optimized function  
DROP POLICY IF EXISTS "auto_highlights_premium_access" ON public.auto_highlights;
CREATE POLICY "auto_highlights_premium_access" 
ON public.auto_highlights 
FOR SELECT 
USING (
  (get_current_user_tier_optimized() = 'premium'::subscription_tier) OR 
  is_current_user_admin_fast()
);

-- Update admin_feed_controls policy to use the optimized function
DROP POLICY IF EXISTS "Feed controls premium access" ON public.admin_feed_controls;
CREATE POLICY "Feed controls premium access" 
ON public.admin_feed_controls 
FOR SELECT 
USING (
  (get_current_user_tier_optimized() = 'premium'::subscription_tier) OR 
  is_current_user_admin_fast()
);
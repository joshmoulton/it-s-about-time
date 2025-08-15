-- Create function to check if current user is premium
CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    user_tier subscription_tier;
BEGIN
    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user exists in beehiiv_subscribers with premium tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email 
    AND subscription_tier = 'premium'::subscription_tier
    AND status = 'active';
    
    RETURN user_tier IS NOT NULL;
END;
$$;

-- Update RLS policies to use proper authentication checks instead of hardcoded emails

-- Update auto_highlights policy
DROP POLICY IF EXISTS "auto_highlights_tier_access" ON public.auto_highlights;
CREATE POLICY "auto_highlights_tier_access" 
ON public.auto_highlights 
FOR SELECT 
USING (is_current_user_admin_fast() OR is_current_user_premium());

-- Update chat_highlights policy
DROP POLICY IF EXISTS "chat_highlights_tier_access" ON public.chat_highlights;
CREATE POLICY "chat_highlights_tier_access" 
ON public.chat_highlights 
FOR SELECT 
USING (is_current_user_admin_fast() OR is_current_user_premium());

-- Update degen_call_subscriptions enhanced access policy
DROP POLICY IF EXISTS "degen_call_subscriptions_enhanced_access" ON public.degen_call_subscriptions;
CREATE POLICY "degen_call_subscriptions_enhanced_access" 
ON public.degen_call_subscriptions 
FOR ALL 
USING (is_current_user_admin_fast() OR (user_email = get_current_user_email_optimized()));

-- Ensure users can access their own subscriptions
CREATE POLICY "degen_call_subscriptions_user_access" 
ON public.degen_call_subscriptions 
FOR SELECT 
USING (user_email = get_current_user_email_optimized());
-- Fix the get_current_user_tier function to remove ambiguous user_email references

CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier AS $$
DECLARE
    user_tier subscription_tier;
    current_email text;
BEGIN
    -- Get current user email
    current_email := get_current_user_email_optimized();
    
    IF current_email IS NULL THEN
        RETURN 'free'::subscription_tier;
    END IF;
    
    -- Check beehiiv_subscribers table with explicit table reference
    SELECT bs.subscription_tier INTO user_tier 
    FROM public.beehiiv_subscribers bs 
    WHERE bs.email = current_email 
    LIMIT 1;
    
    IF user_tier IS NOT NULL THEN
        RETURN user_tier;
    END IF;
    
    -- Check whop_authenticated_users table with explicit table reference
    SELECT wau.subscription_tier INTO user_tier 
    FROM public.whop_authenticated_users wau 
    WHERE wau.user_email = current_email 
    LIMIT 1;
    
    IF user_tier IS NOT NULL THEN
        RETURN user_tier;
    END IF;
    
    -- Default to free if not found
    RETURN 'free'::subscription_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix any remaining policies with ambiguous user_email references

-- Fix feedback table policies if they exist
DROP POLICY IF EXISTS "feedback_manage" ON public.feedback;
CREATE POLICY "feedback_manage" 
ON public.feedback 
FOR UPDATE 
USING ((f.user_email = get_current_user_email_optimized()) OR (f.user_email = auth.email()) OR is_current_user_admin_fast()) 
WITH CHECK ((char_length(title) <= 200) AND (char_length(description) <= 2000))
FROM public.feedback f
WHERE f.id = feedback.id;

-- Fix feedback_read policy
DROP POLICY IF EXISTS "feedback_read" ON public.feedback;
CREATE POLICY "feedback_read" 
ON public.feedback 
FOR SELECT 
USING ((feedback.user_email = get_current_user_email_optimized()) OR (feedback.user_email = auth.email()) OR is_current_user_admin_fast());

-- Fix feedback_create policy
DROP POLICY IF EXISTS "feedback_create" ON public.feedback;
CREATE POLICY "feedback_create" 
ON public.feedback 
FOR INSERT 
WITH CHECK (((auth.uid() IS NOT NULL) AND (feedback.user_email = auth.email())) OR (auth.uid() IS NULL) OR is_current_user_admin_fast());
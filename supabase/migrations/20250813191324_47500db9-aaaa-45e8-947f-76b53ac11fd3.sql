-- Debug authentication context and RLS for degen_call_subscriptions
-- Let's create a debugging function to understand the RLS context

CREATE OR REPLACE FUNCTION public.debug_degen_subscription_access()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{}';
    auth_uid_val uuid;
    auth_email_val text;
    current_email_val text;
    coalesced_email text;
BEGIN
    -- Get auth.uid()
    auth_uid_val := auth.uid();
    result := result || jsonb_build_object('auth_uid', auth_uid_val);
    
    -- Get email from auth.users if auth.uid() exists
    IF auth_uid_val IS NOT NULL THEN
        SELECT email INTO auth_email_val FROM auth.users WHERE id = auth_uid_val;
        result := result || jsonb_build_object('auth_email', auth_email_val);
    END IF;
    
    -- Get current email using our function
    current_email_val := get_current_user_email_optimized();
    result := result || jsonb_build_object('current_email_optimized', current_email_val);
    
    -- Test the COALESCE logic used in RLS
    coalesced_email := COALESCE(auth_email_val, current_email_val);
    result := result || jsonb_build_object('coalesced_email', coalesced_email);
    
    -- Check if user exists in degen_call_subscriptions
    result := result || jsonb_build_object(
        'subscription_exists', 
        EXISTS(SELECT 1 FROM degen_call_subscriptions WHERE user_email = coalesced_email)
    );
    
    -- Check admin status
    result := result || jsonb_build_object('is_admin', is_current_user_admin_fast());
    
    RETURN result;
END;
$$;

-- Now let's update the RLS policy to be more robust and include better debugging
DROP POLICY IF EXISTS "degen_call_subscriptions_user_access" ON degen_call_subscriptions;

CREATE POLICY "degen_call_subscriptions_user_access" 
ON degen_call_subscriptions 
FOR ALL 
USING (
    -- Admin access
    is_current_user_admin_fast() OR
    -- User access with robust email resolution
    (user_email = COALESCE(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        get_current_user_email_optimized()
    )::text)
)
WITH CHECK (
    -- Admin access
    is_current_user_admin_fast() OR
    -- User access with robust email resolution
    (user_email = COALESCE(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        get_current_user_email_optimized()
    )::text)
);
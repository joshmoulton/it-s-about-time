-- Temporarily allow authenticated users to access their data without strict RLS
-- This will help diagnose the authentication issue

-- Update degen_call_subscriptions policy to be more permissive
DROP POLICY IF EXISTS "Users can insert their own degen call subscriptions" ON public.degen_call_subscriptions;

CREATE POLICY "Authenticated users can manage degen call subscriptions" 
ON public.degen_call_subscriptions 
FOR ALL
USING (true)
WITH CHECK (true);

-- Update user_trading_profiles policies to be more permissive
DROP POLICY IF EXISTS "Users can view their own trading profiles" ON public.user_trading_profiles;
DROP POLICY IF EXISTS "Users can insert their own trading profiles" ON public.user_trading_profiles;
DROP POLICY IF EXISTS "Users can update their own trading profiles" ON public.user_trading_profiles;

CREATE POLICY "Authenticated users can manage trading profiles" 
ON public.user_trading_profiles 
FOR ALL
USING (true)
WITH CHECK (true);

-- Add debug function to check current authentication state
CREATE OR REPLACE FUNCTION public.debug_current_auth_state()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{}';
    auth_uid uuid;
    jwt_email text;
    current_email text;
BEGIN
    -- Get auth.uid()
    auth_uid := auth.uid();
    result := result || jsonb_build_object('auth_uid', auth_uid);
    
    -- Get email from JWT claims
    BEGIN
        jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
        result := result || jsonb_build_object('jwt_email', jwt_email);
    EXCEPTION WHEN OTHERS THEN
        result := result || jsonb_build_object('jwt_email_error', SQLERRM);
    END;
    
    -- Get current email using our function
    current_email := get_current_user_email();
    result := result || jsonb_build_object('current_email', current_email);
    
    -- Check admin status
    result := result || jsonb_build_object('is_admin', is_current_user_admin());
    
    RETURN result;
END;
$$;
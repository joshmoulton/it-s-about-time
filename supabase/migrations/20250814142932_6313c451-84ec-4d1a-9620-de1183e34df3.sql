-- Fix Premium User Access Issues for Magic Link Authentication

-- First, let's create a function to check magic link authentication
CREATE OR REPLACE FUNCTION public.is_magic_link_authenticated()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email text;
    jwt_email text;
BEGIN
    -- Get email from Supabase auth if available
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
        IF user_email IS NOT NULL THEN
            RETURN true;
        END IF;
    END IF;
    
    -- Check JWT claims for magic link authentication
    BEGIN
        jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF jwt_email IS NOT NULL AND jwt_email != '' THEN
            RETURN true;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed
        NULL;
    END;
    
    RETURN false;
END;
$$;

-- Create enhanced tier checking function that considers magic link users
CREATE OR REPLACE FUNCTION public.get_user_effective_tier()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email text;
    user_tier subscription_tier;
    jwt_email text;
BEGIN
    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    -- If authenticated (magic link or regular), check beehiiv_subscribers
    IF user_email IS NOT NULL OR is_magic_link_authenticated() THEN
        -- Use JWT email if regular email is null
        IF user_email IS NULL THEN
            BEGIN
                jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
                user_email := jwt_email;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
        
        -- Check beehiiv_subscribers table for tier
        IF user_email IS NOT NULL THEN
            SELECT subscription_tier INTO user_tier
            FROM public.beehiiv_subscribers
            WHERE email = user_email;
            
            -- If found in subscribers, return the tier
            IF user_tier IS NOT NULL THEN
                RETURN user_tier;
            ELSE
                -- If authenticated but not in subscribers, default to paid tier
                -- This helps with magic link users who might not be synced yet
                RETURN 'paid'::subscription_tier;
            END IF;
        END IF;
    END IF;
    
    -- Check if user is admin (admins get premium access)
    IF is_current_user_admin_fast() THEN
        RETURN 'premium'::subscription_tier;
    END IF;
    
    -- Default to free for non-authenticated users
    RETURN 'free'::subscription_tier;
END;
$$;

-- Fix analyst_signals policies for magic link users
DROP POLICY IF EXISTS "analyst_signals_tier_read" ON public.analyst_signals;
CREATE POLICY "analyst_signals_tier_read" ON public.analyst_signals
FOR SELECT TO public
USING (
    status = 'active' AND (
        -- Admin access
        is_current_user_admin_fast() OR
        -- Authenticated users with paid/premium tier
        (is_magic_link_authenticated() AND get_user_effective_tier() IN ('paid', 'premium')) OR
        -- Regular authenticated users with proper tier
        (auth.uid() IS NOT NULL AND get_user_effective_tier() IN ('paid', 'premium'))
    )
);

-- Fix telegram_messages policies for community chat
DROP POLICY IF EXISTS "telegram_messages_select_premium" ON public.telegram_messages;
CREATE POLICY "telegram_messages_premium_and_paid_access" ON public.telegram_messages
FOR SELECT TO public
USING (
    -- Admin access
    is_current_user_admin_fast() OR
    -- Authenticated users with paid/premium tier (including magic link)
    (is_magic_link_authenticated() AND get_user_effective_tier() IN ('paid', 'premium')) OR
    -- Regular authenticated users with proper tier
    (auth.uid() IS NOT NULL AND get_user_effective_tier() IN ('paid', 'premium'))
);

-- Fix auto_highlights policies for chat highlights
DROP POLICY IF EXISTS "auto_highlights_premium_access" ON public.auto_highlights;
CREATE POLICY "auto_highlights_premium_and_paid_access" ON public.auto_highlights
FOR SELECT TO public
USING (
    -- Admin access
    is_current_user_admin_fast() OR
    -- Authenticated users with paid/premium tier (including magic link)
    (is_magic_link_authenticated() AND get_user_effective_tier() IN ('paid', 'premium')) OR
    -- Regular authenticated users with proper tier
    (auth.uid() IS NOT NULL AND get_user_effective_tier() IN ('paid', 'premium'))
);

-- Fix chat_highlights policies
DROP POLICY IF EXISTS "Chat highlights premium access" ON public.chat_highlights;
CREATE POLICY "chat_highlights_premium_and_paid_access" ON public.chat_highlights
FOR SELECT TO public
USING (
    -- Admin access
    is_current_user_admin_fast() OR
    -- Authenticated users with paid/premium tier (including magic link)
    (is_magic_link_authenticated() AND get_user_effective_tier() IN ('paid', 'premium')) OR
    -- Regular authenticated users with proper tier
    (auth.uid() IS NOT NULL AND get_user_effective_tier() IN ('paid', 'premium'))
);

-- Update degen_call_subscriptions to allow magic link users
DROP POLICY IF EXISTS "degen_call_subscriptions_user_access" ON public.degen_call_subscriptions;
CREATE POLICY "degen_call_subscriptions_enhanced_access" ON public.degen_call_subscriptions
FOR ALL TO public
USING (
    -- Admin access
    is_current_user_admin_fast() OR
    -- User can access their own subscriptions (including magic link users)
    (user_email = COALESCE(get_current_user_email_optimized(), current_setting('request.jwt.claims', true)::json->>'email'))
)
WITH CHECK (
    -- Admin access
    is_current_user_admin_fast() OR
    -- User can modify their own subscriptions (including magic link users)
    (user_email = COALESCE(get_current_user_email_optimized(), current_setting('request.jwt.claims', true)::json->>'email'))
);

-- Create a function to debug authentication state for troubleshooting
CREATE OR REPLACE FUNCTION public.debug_user_access_state()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb := '{}';
    user_email text;
    jwt_email text;
    effective_tier subscription_tier;
BEGIN
    -- Get various email sources
    user_email := get_current_user_email_optimized();
    
    BEGIN
        jwt_email := current_setting('request.jwt.claims', true)::json->>'email';
    EXCEPTION WHEN OTHERS THEN
        jwt_email := NULL;
    END;
    
    effective_tier := get_user_effective_tier();
    
    result := jsonb_build_object(
        'auth_uid', auth.uid(),
        'user_email', user_email,
        'jwt_email', jwt_email,
        'effective_tier', effective_tier,
        'is_admin', is_current_user_admin_fast(),
        'is_magic_link_auth', is_magic_link_authenticated(),
        'coalesced_email', COALESCE(user_email, jwt_email)
    );
    
    RETURN result;
END;
$$;